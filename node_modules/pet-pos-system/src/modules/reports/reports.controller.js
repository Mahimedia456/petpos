function cleanText(value) {
  return String(value || "").trim();
}

function getDateRange(req) {
  const dateFrom = cleanText(req.query.date_from);
  const dateTo = cleanText(req.query.date_to);

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  };
}

function buildDateWhere(alias = "o") {
  return `
    ($1::date is null or ${alias}.created_at >= $1::date)
    and ($2::date is null or ${alias}.created_at < ($2::date + interval '1 day'))
  `;
}

export function getReportsSummary(pool) {
  return async function (req, res) {
    try {
      const { dateFrom, dateTo } = getDateRange(req);
      const params = [dateFrom, dateTo];

      const salesSummaryQuery = `
        select
          count(*)::int as total_orders,
          count(*) filter (where status = 'completed')::int as completed_orders,
          count(*) filter (where status = 'cancelled')::int as cancelled_orders,
          count(*) filter (where payment_status = 'paid')::int as paid_orders,
          count(*) filter (where payment_status = 'unpaid')::int as unpaid_orders,

          coalesce(sum(total_amount), 0)::numeric as gross_sales,
          coalesce(sum(subtotal), 0)::numeric as subtotal_sales,
          coalesce(sum(discount_amount), 0)::numeric as total_discount,
          coalesce(sum(promotion_discount), 0)::numeric as promotion_discount,
          coalesce(sum(delivery_fee), 0)::numeric as delivery_fees,

          coalesce(avg(total_amount), 0)::numeric as average_order_value
        from orders o
        where ${buildDateWhere("o")}
      `;

      const dailySalesQuery = `
        select
          to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD') as sale_date,
          count(*)::int as orders_count,
          coalesce(sum(o.total_amount), 0)::numeric as total_sales
        from orders o
        where ${buildDateWhere("o")}
        group by date_trunc('day', o.created_at)
        order by sale_date asc
      `;

      const paymentBreakdownQuery = `
        select
          coalesce(p.payment_method, 'unknown') as payment_method,
          count(*)::int as payments_count,
          coalesce(sum(p.amount), 0)::numeric as total_amount
        from payments p
        join orders o on o.id = p.order_id
        where ${buildDateWhere("o")}
        group by coalesce(p.payment_method, 'unknown')
        order by total_amount desc
      `;

      const channelBreakdownQuery = `
        select
          coalesce(o.channel, 'walk_in') as channel,
          count(*)::int as orders_count,
          coalesce(sum(o.total_amount), 0)::numeric as total_sales
        from orders o
        where ${buildDateWhere("o")}
        group by coalesce(o.channel, 'walk_in')
        order by total_sales desc
      `;

      const topProductsQuery = `
        select
          coalesce(oi.product_name, p.name, 'Product') as product_name,
          coalesce(oi.sku, p.sku, '-') as sku,
          coalesce(sum(oi.quantity), 0)::int as units_sold,
          coalesce(sum(oi.total_price), 0)::numeric as total_sales
        from order_items oi
        join orders o on o.id = oi.order_id
        left join products p on p.id = oi.product_id
        where ${buildDateWhere("o")}
        group by coalesce(oi.product_name, p.name, 'Product'), coalesce(oi.sku, p.sku, '-')
        order by units_sold desc, total_sales desc
        limit 15
      `;

      const inventorySummaryQuery = `
        select
          count(*)::int as total_products,
          coalesce(sum(stock_quantity), 0)::int as total_stock_units,
          coalesce(sum(stock_quantity * cost_price), 0)::numeric as inventory_cost_value,
          coalesce(sum(stock_quantity * sale_price), 0)::numeric as inventory_sale_value,
          count(*) filter (where stock_quantity <= low_stock_threshold)::int as low_stock_count,
          count(*) filter (
            where expiry_date is not null
              and expiry_date <= current_date + interval '30 days'
              and expiry_date >= current_date
          )::int as expiring_soon_count,
          count(*) filter (
            where expiry_date is not null
              and expiry_date < current_date
          )::int as expired_count
        from products
        where coalesce(is_active, true) = true
      `;

      const lowStockProductsQuery = `
        select
          p.id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.low_stock_threshold,
          p.sale_price,
          c.name as category_name
        from products p
        left join categories c on c.id = p.category_id
        where coalesce(p.is_active, true) = true
          and p.stock_quantity <= p.low_stock_threshold
        order by p.stock_quantity asc, p.name asc
        limit 15
      `;

      const codSummaryQuery = `
        select
          count(*) filter (where cod_status = 'pending')::int as pending_cod_orders,
          count(*) filter (where cod_status = 'received')::int as received_cod_orders,
          count(*) filter (where cod_status = 'deposited')::int as deposited_cod_orders,
          coalesce(sum(cod_amount) filter (where cod_status = 'pending'), 0)::numeric as pending_cod_amount,
          coalesce(sum(cod_amount) filter (where cod_status in ('received', 'deposited')), 0)::numeric as received_cod_amount
        from orders o
        where ${buildDateWhere("o")}
      `;

      const riderPerformanceQuery = `
        select
          r.id,
          r.name as rider_name,
          r.phone as rider_phone,
          count(o.id)::int as assigned_orders,
          count(o.id) filter (where o.delivery_status = 'delivered')::int as delivered_orders,
          count(o.id) filter (where o.delivery_status in ('failed', 'returned'))::int as failed_orders,
          coalesce(sum(o.cod_amount) filter (where o.cod_status = 'pending'), 0)::numeric as pending_cod,
          coalesce(sum(o.cod_amount) filter (where o.cod_status in ('received', 'deposited')), 0)::numeric as received_cod
        from delivery_riders r
        left join orders o on o.rider_id = r.id and ${buildDateWhere("o")}
        where r.is_active = true
        group by r.id
        order by delivered_orders desc, assigned_orders desc
        limit 15
      `;

      const topCustomersQuery = `
        select
          coalesce(c.id, o.customer_id) as customer_id,
          coalesce(c.name, o.customer_name, 'Walk-in Customer') as customer_name,
          coalesce(c.phone, o.customer_phone, '-') as customer_phone,
          count(o.id)::int as orders_count,
          coalesce(sum(o.total_amount), 0)::numeric as total_spent
        from orders o
        left join customers c on c.id = o.customer_id
        where ${buildDateWhere("o")}
        group by coalesce(c.id, o.customer_id), coalesce(c.name, o.customer_name, 'Walk-in Customer'), coalesce(c.phone, o.customer_phone, '-')
        order by total_spent desc
        limit 15
      `;

      const promotionSummaryQuery = `
        select
          p.id,
          p.name,
          p.code,
          p.discount_type,
          p.discount_value,
          count(pu.id)::int as used_count,
          coalesce(sum(pu.discount_amount), 0)::numeric as total_discount,
          coalesce(sum(pu.order_total), 0)::numeric as generated_sales
        from promotions p
        left join promotion_usages pu
          on pu.promotion_id = p.id
          and ($1::date is null or pu.created_at >= $1::date)
          and ($2::date is null or pu.created_at < ($2::date + interval '1 day'))
        group by p.id
        order by used_count desc, generated_sales desc
        limit 15
      `;

      const [
        salesSummary,
        dailySales,
        paymentBreakdown,
        channelBreakdown,
        topProducts,
        inventorySummary,
        lowStockProducts,
        codSummary,
        riderPerformance,
        topCustomers,
        promotionSummary,
      ] = await Promise.all([
        pool.query(salesSummaryQuery, params),
        pool.query(dailySalesQuery, params),
        pool.query(paymentBreakdownQuery, params),
        pool.query(channelBreakdownQuery, params),
        pool.query(topProductsQuery, params),
        pool.query(inventorySummaryQuery),
        pool.query(lowStockProductsQuery),
        pool.query(codSummaryQuery, params),
        pool.query(riderPerformanceQuery, params),
        pool.query(topCustomersQuery, params),
        pool.query(promotionSummaryQuery, params),
      ]);

      res.json({
        ok: true,
        data: {
          sales_summary: salesSummary.rows[0],
          daily_sales: dailySales.rows,
          payment_breakdown: paymentBreakdown.rows,
          channel_breakdown: channelBreakdown.rows,
          top_products: topProducts.rows,
          inventory_summary: inventorySummary.rows[0],
          low_stock_products: lowStockProducts.rows,
          cod_summary: codSummary.rows[0],
          rider_performance: riderPerformance.rows,
          top_customers: topCustomers.rows,
          promotion_summary: promotionSummary.rows,
        },
      });
    } catch (error) {
      console.error("[getReportsSummary]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load reports summary.",
      });
    }
  };
}