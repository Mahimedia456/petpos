const demoOrders = [
  {
    orderNo: "POS-1001",
    customer: "Walk-in Customer",
    source: "POS",
    status: "Completed",
    total: "Rs. 4,250",
  },
  {
    orderNo: "WA-1002",
    customer: "WhatsApp Order",
    source: "WhatsApp",
    status: "Processing",
    total: "Rs. 7,900",
  },
  {
    orderNo: "WEB-1003",
    customer: "WooCommerce",
    source: "Website",
    status: "Pending",
    total: "Rs. 3,150",
  },
];

export default function RecentOrdersTable() {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-black text-slate-950">Recent Orders</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Latest POS, WhatsApp and website orders.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Source</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {demoOrders.map((order) => (
              <tr key={order.orderNo}>
                <td className="px-5 py-4 text-sm font-black text-slate-950">
                  {order.orderNo}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                  {order.customer}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                  {order.source}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-sm font-black text-slate-950">
                  {order.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}