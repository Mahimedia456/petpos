import {
  createWooClient,
  getWooSettings,
  normalizeWooOrder,
  normalizeWooProduct,
} from "./woocommerce.service.js";
import { writeActivityLog } from "../audit/audit.service.js";

function cleanText(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function hideSecret(value) {
  if (!value) return "";
  const text = String(value);
  if (text.length <= 8) return "********";
  return `${text.slice(0, 4)}********${text.slice(-4)}`;
}

function buildOrderNumber(prefix = "WEB") {
  return `${prefix}-${Date.now()}`;
}

export function getWooCommerceSettings(pool) {
  return async function (req, res) {
    try {
      const settings = await getWooSettings(pool);

      res.json({
        ok: true,
        data: {
          ...settings,
          consumer_secret: settings.consumer_secret
            ? hideSecret(settings.consumer_secret)
            : "",
        },
      });
    } catch (error) {
      console.error("[getWooCommerceSettings]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load WooCommerce settings.",
      });
    }
  };
}

export function updateWooCommerceSettings(pool) {
  return async function (req, res) {
    try {
      const current = await getWooSettings(pool);
      const body = req.body || {};

      const siteUrl = cleanText(body.site_url);
      const consumerKey = cleanText(body.consumer_key);

      let consumerSecret = cleanText(body.consumer_secret);

      if (consumerSecret.includes("********")) {
        consumerSecret = current.consumer_secret || "";
      }

      const result = await pool.query(
        `
        update woocommerce_settings
        set
          site_url = $1,
          consumer_key = $2,
          consumer_secret = $3,
          sync_products_enabled = $4,
          sync_orders_enabled = $5,
          push_stock_enabled = $6,
          updated_at = now()
        where id = $7
        returning *
        `,
        [
          nullableText(siteUrl),
          nullableText(consumerKey),
          nullableText(consumerSecret),
          toBool(body.sync_products_enabled, true),
          toBool(body.sync_orders_enabled, true),
          toBool(body.push_stock_enabled, true),
          current.id,
        ]
      );

      await writeActivityLog(pool, req, {
        action: "settings_update",
        module_key: "settings",
        entity_type: "woocommerce_settings",
        entity_id: current.id,
        title: "WooCommerce settings updated",
        description: "WooCommerce integration settings were updated.",
        before_data: {
          ...current,
          consumer_secret: current.consumer_secret ? "***" : null,
        },
        after_data: {
          ...result.rows[0],
          consumer_secret: result.rows[0].consumer_secret ? "***" : null,
        },
      });

      res.json({
        ok: true,
        message: "WooCommerce settings saved successfully.",
        data: {
          ...result.rows[0],
          consumer_secret: result.rows[0].consumer_secret
            ? hideSecret(result.rows[0].consumer_secret)
            : "",
        },
      });
    } catch (error) {
      console.error("[updateWooCommerceSettings]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update WooCommerce settings.",
      });
    }
  };
}

export function getWooCommerceStatus(pool) {
  return async function (req, res) {
    try {
      const settings = await getWooSettings(pool);

      const productsResult = await pool.query(`
        select
          count(*) filter (where woo_product_id is not null)::int as woo_products,
          count(*) filter (where woo_sync_status = 'synced')::int as synced_products,
          count(*) filter (where woo_sync_status = 'failed')::int as failed_products
        from products
      `);

      const ordersResult = await pool.query(`
        select
          count(*) filter (where woo_order_id is not null)::int as woo_orders,
          count(*) filter (where woo_sync_status = 'synced')::int as synced_orders,
          count(*) filter (where woo_sync_status = 'failed')::int as failed_orders
        from orders
      `);

      const logsResult = await pool.query(`
        select *
        from woocommerce_sync_logs
        order by created_at desc
        limit 20
      `);

      res.json({
        ok: true,
        data: {
          settings: {
            site_url: settings.site_url,
            is_connected: settings.is_connected,
            sync_products_enabled: settings.sync_products_enabled,
            sync_orders_enabled: settings.sync_orders_enabled,
            push_stock_enabled: settings.push_stock_enabled,
            last_product_sync_at: settings.last_product_sync_at,
            last_order_sync_at: settings.last_order_sync_at,
          },
          products: productsResult.rows[0],
          orders: ordersResult.rows[0],
          logs: logsResult.rows,
        },
      });
    } catch (error) {
      console.error("[getWooCommerceStatus]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load WooCommerce status.",
      });
    }
  };
}

export function testWooCommerceConnection(pool) {
  return async function (req, res) {
    try {
      const settings = await getWooSettings(pool);
      const woo = createWooClient(settings);

      const result = await woo.get("/products?per_page=1");

      await pool.query(
        `
        update woocommerce_settings
        set is_connected = true,
            updated_at = now()
        where id = $1
        `,
        [settings.id]
      );

      await writeActivityLog(pool, req, {
        action: "update",
        module_key: "settings",
        entity_type: "woocommerce_settings",
        entity_id: settings.id,
        title: "WooCommerce connection tested",
        description: "WooCommerce API connection was tested successfully.",
      });

      res.json({
        ok: true,
        message: "WooCommerce connection successful.",
        data: {
          products_preview_count: Array.isArray(result) ? result.length : 0,
        },
      });
    } catch (error) {
      console.error("[testWooCommerceConnection]", error);

      const settings = await getWooSettings(pool);

      await pool.query(
        `
        update woocommerce_settings
        set is_connected = false,
            updated_at = now()
        where id = $1
        `,
        [settings.id]
      );

      res.status(400).json({
        ok: false,
        message: error.message || "WooCommerce connection failed.",
      });
    }
  };
}

export function syncWooCommerceProducts(pool) {
  return async function (req, res) {
    try {
      const settings = await getWooSettings(pool);

      if (!settings.sync_products_enabled) {
        return res.status(400).json({
          ok: false,
          message: "Product sync is disabled in settings.",
        });
      }

      const woo = createWooClient(settings);

      let page = 1;
      let totalCount = 0;
      let successCount = 0;
      let failedCount = 0;

      while (page <= 20) {
        const wooProducts = await woo.get(
          `/products?per_page=100&page=${page}&status=publish`
        );

        if (!Array.isArray(wooProducts) || !wooProducts.length) break;

        for (const wooProduct of wooProducts) {
          totalCount += 1;

          try {
            const product = normalizeWooProduct(wooProduct);

            const existing = await pool.query(
              `
              select id
              from products
              where woo_product_id = $1
                 or sku = $2
              limit 1
              `,
              [product.woo_product_id, product.sku]
            );

            if (existing.rows.length) {
              await pool.query(
                `
                update products
                set
                  name = $1,
                  sku = $2,
                  barcode = coalesce(barcode, $3),
                  description = $4,
                  sale_price = $5,
                  stock_quantity = $6,
                  image_url = coalesce(image_url, $7),
                  woo_product_id = $8,
                  woo_permalink = $9,
                  woo_sync_status = 'synced',
                  woo_last_synced_at = now(),
                  updated_at = now()
                where id = $10
                `,
                [
                  product.name,
                  product.sku,
                  product.barcode,
                  product.description,
                  product.sale_price,
                  product.stock_quantity,
                  product.image_url,
                  product.woo_product_id,
                  product.woo_permalink,
                  existing.rows[0].id,
                ]
              );
            } else {
              await pool.query(
                `
                insert into products (
                  name,
                  sku,
                  barcode,
                  description,
                  sale_price,
                  cost_price,
                  stock_quantity,
                  image_url,
                  woo_product_id,
                  woo_permalink,
                  woo_sync_status,
                  woo_last_synced_at,
                  is_active
                )
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'synced', now(), true)
                `,
                [
                  product.name,
                  product.sku,
                  product.barcode,
                  product.description,
                  product.sale_price,
                  product.cost_price,
                  product.stock_quantity,
                  product.image_url,
                  product.woo_product_id,
                  product.woo_permalink,
                ]
              );
            }

            successCount += 1;
          } catch (error) {
            failedCount += 1;
            console.error("[syncWooProduct:item]", error);
          }
        }

        page += 1;
      }

      await pool.query(
        `
        update woocommerce_settings
        set last_product_sync_at = now(),
            updated_at = now()
        where id = $1
        `,
        [settings.id]
      );

      await pool.query(
        `
        insert into woocommerce_sync_logs (
          sync_type,
          status,
          message,
          total_count,
          success_count,
          failed_count,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          "products",
          failedCount > 0 ? "partial" : "success",
          "WooCommerce product sync completed.",
          totalCount,
          successCount,
          failedCount,
          JSON.stringify({
            pages_checked: page - 1,
          }),
        ]
      );

      await writeActivityLog(pool, req, {
        action: "update",
        module_key: "products",
        entity_type: "woocommerce_sync",
        title: "WooCommerce products synced",
        description: `${successCount} products synced from WooCommerce.`,
        metadata: {
          total_count: totalCount,
          success_count: successCount,
          failed_count: failedCount,
        },
      });

      res.json({
        ok: true,
        message: "WooCommerce products synced successfully.",
        data: {
          total_count: totalCount,
          success_count: successCount,
          failed_count: failedCount,
        },
      });
    } catch (error) {
      console.error("[syncWooCommerceProducts]", error);

      await pool.query(
        `
        insert into woocommerce_sync_logs (
          sync_type,
          status,
          message,
          failed_count
        )
        values ('products', 'failed', $1, 1)
        `,
        [error.message]
      );

      res.status(500).json({
        ok: false,
        message: error.message || "Failed to sync WooCommerce products.",
      });
    }
  };
}

export function importWooCommerceOrders(pool) {
  return async function (req, res) {
    const client = await pool.connect();

    try {
      const settings = await getWooSettings(pool);

      if (!settings.sync_orders_enabled) {
        return res.status(400).json({
          ok: false,
          message: "Order sync is disabled in settings.",
        });
      }

      const woo = createWooClient(settings);

      const status = cleanText(req.body?.status) || "processing";
      const wooOrders = await woo.get(
        `/orders?per_page=100&page=1&status=${encodeURIComponent(status)}`
      );

      let totalCount = 0;
      let successCount = 0;
      let failedCount = 0;

      await client.query("begin");

      for (const wooOrder of Array.isArray(wooOrders) ? wooOrders : []) {
        totalCount += 1;

        try {
          const normalized = normalizeWooOrder(wooOrder);

          const existing = await client.query(
            `
            select id
            from orders
            where woo_order_id = $1
            limit 1
            `,
            [normalized.woo_order_id]
          );

          if (existing.rows.length) {
            continue;
          }

          let customerId = null;

          if (normalized.customer_phone) {
            const customerResult = await client.query(
              `
              select id
              from customers
              where phone = $1
                and is_active = true
              limit 1
              `,
              [normalized.customer_phone]
            );

            if (customerResult.rows.length) {
              customerId = customerResult.rows[0].id;
            } else {
              const createdCustomer = await client.query(
                `
                insert into customers (
                  name,
                  phone,
                  address,
                  whatsapp_opt_in,
                  notes
                )
                values ($1, $2, $3, true, 'Created from WooCommerce order')
                returning id
                `,
                [
                  normalized.customer_name,
                  normalized.customer_phone,
                  normalized.delivery_address,
                ]
              );

              customerId = createdCustomer.rows[0].id;
            }
          }

          const orderResult = await client.query(
            `
            insert into orders (
              order_number,
              customer_id,
              channel,
              status,
              payment_status,
              customer_name,
              customer_phone,
              delivery_address,
              delivery_fee,
              subtotal,
              discount_amount,
              total_amount,
              delivery_status,
              cod_amount,
              cod_status,
              notes,
              woo_order_id,
              woo_order_number,
              woo_status,
              woo_sync_status,
              woo_last_synced_at
            )
            values (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9, $10,
              $11, $12, 'not_assigned',
              $13, $14, $15,
              $16, $17, $18, 'synced', now()
            )
            returning id
            `,
            [
              buildOrderNumber("WEB"),
              customerId,
              normalized.channel,
              normalized.status,
              normalized.payment_status,
              normalized.customer_name,
              normalized.customer_phone,
              normalized.delivery_address,
              normalized.delivery_fee,
              normalized.subtotal,
              normalized.discount_amount,
              normalized.total_amount,
              normalized.payment_status === "unpaid"
                ? normalized.total_amount
                : 0,
              normalized.payment_status === "unpaid"
                ? "pending"
                : "not_applicable",
              normalized.notes,
              normalized.woo_order_id,
              normalized.woo_order_number,
              normalized.woo_status,
            ]
          );

          const orderId = orderResult.rows[0].id;

          for (const item of wooOrder.line_items || []) {
            const wooProductId = item.product_id || null;

            let productId = null;
            let sku = item.sku || null;

            if (wooProductId) {
              const productResult = await client.query(
                `
                select id, sku
                from products
                where woo_product_id = $1
                limit 1
                `,
                [wooProductId]
              );

              if (productResult.rows.length) {
                productId = productResult.rows[0].id;
                sku = productResult.rows[0].sku || sku;
              }
            }

            await client.query(
              `
              insert into order_items (
                order_id,
                product_id,
                product_name,
                sku,
                quantity,
                unit_price,
                total_price
              )
              values ($1, $2, $3, $4, $5, $6, $7)
              `,
              [
                orderId,
                productId,
                item.name || "WooCommerce Product",
                sku,
                Number(item.quantity || 1),
                Number(item.price || 0),
                Number(item.total || 0),
              ]
            );
          }

          await client.query(
            `
            insert into payments (
              order_id,
              payment_method,
              amount,
              status
            )
            values ($1, $2, $3, $4)
            `,
            [
              orderId,
              wooOrder.payment_method || "woocommerce",
              normalized.total_amount,
              normalized.payment_status,
            ]
          );

          if (customerId) {
            await client.query(
              `
              update customers
              set
                total_orders = total_orders + 1,
                total_spent = total_spent + $1,
                last_order_at = now(),
                updated_at = now()
              where id = $2
              `,
              [normalized.total_amount, customerId]
            );
          }

          successCount += 1;
        } catch (error) {
          failedCount += 1;
          console.error("[importWooOrder:item]", error);
        }
      }

      await client.query(
        `
        update woocommerce_settings
        set last_order_sync_at = now(),
            updated_at = now()
        where id = $1
        `,
        [settings.id]
      );

      await client.query(
        `
        insert into woocommerce_sync_logs (
          sync_type,
          status,
          message,
          total_count,
          success_count,
          failed_count,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          "orders",
          failedCount > 0 ? "partial" : "success",
          "WooCommerce orders imported.",
          totalCount,
          successCount,
          failedCount,
          JSON.stringify({
            woo_status: status,
          }),
        ]
      );

      await client.query("commit");

      await writeActivityLog(pool, req, {
        action: "create",
        module_key: "orders",
        entity_type: "woocommerce_sync",
        title: "WooCommerce orders imported",
        description: `${successCount} orders imported from WooCommerce.`,
        metadata: {
          total_count: totalCount,
          success_count: successCount,
          failed_count: failedCount,
          woo_status: status,
        },
      });

      res.json({
        ok: true,
        message: "WooCommerce orders imported successfully.",
        data: {
          total_count: totalCount,
          success_count: successCount,
          failed_count: failedCount,
        },
      });
    } catch (error) {
      await client.query("rollback");
      console.error("[importWooCommerceOrders]", error);

      await pool.query(
        `
        insert into woocommerce_sync_logs (
          sync_type,
          status,
          message,
          failed_count
        )
        values ('orders', 'failed', $1, 1)
        `,
        [error.message]
      );

      res.status(500).json({
        ok: false,
        message: error.message || "Failed to import WooCommerce orders.",
      });
    } finally {
      client.release();
    }
  };
}

export function pushProductStockToWooCommerce(pool) {
  return async function (req, res) {
    try {
      const { productId } = req.params;
      const settings = await getWooSettings(pool);

      if (!settings.push_stock_enabled) {
        return res.status(400).json({
          ok: false,
          message: "Push stock is disabled in settings.",
        });
      }

      const productResult = await pool.query(
        `
        select
          id,
          name,
          stock_quantity,
          woo_product_id
        from products
        where id = $1
        limit 1
        `,
        [productId]
      );

      if (!productResult.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Product not found.",
        });
      }

      const product = productResult.rows[0];

      if (!product.woo_product_id) {
        return res.status(400).json({
          ok: false,
          message: "Product is not linked with WooCommerce.",
        });
      }

      const woo = createWooClient(settings);

      await woo.put(`/products/${product.woo_product_id}`, {
        manage_stock: true,
        stock_quantity: Number(product.stock_quantity || 0),
      });

      await pool.query(
        `
        update products
        set woo_sync_status = 'synced',
            woo_last_synced_at = now(),
            updated_at = now()
        where id = $1
        `,
        [productId]
      );

      await writeActivityLog(pool, req, {
        action: "update",
        module_key: "products",
        entity_type: "product",
        entity_id: productId,
        title: "Stock pushed to WooCommerce",
        description: `${product.name} stock was pushed to WooCommerce.`,
        after_data: {
          woo_product_id: product.woo_product_id,
          stock_quantity: product.stock_quantity,
        },
      });

      res.json({
        ok: true,
        message: "Stock pushed to WooCommerce successfully.",
      });
    } catch (error) {
      console.error("[pushProductStockToWooCommerce]", error);
      res.status(500).json({
        ok: false,
        message: error.message || "Failed to push stock to WooCommerce.",
      });
    }
  };
}