import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";
import {
  ClipboardList,
  DollarSign,
  Users,
  TrendingUp,
  Flame,
} from "lucide-react";

interface AdminDashboardViewProps {
  orders: any[];
  loading: boolean;
}

export function AdminDashboardView({ orders, loading }: AdminDashboardViewProps) {
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days" | "all">("all");

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (!o.created_at) return true;
      const orderDate = new Date(o.created_at);
      const diffTime = now.getTime() - orderDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeRange === "today") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (timeRange === "7days") {
        return diffDays <= 7;
      }
      if (timeRange === "30days") {
        return diffDays <= 30;
      }
      return true;
    });
  }, [orders, timeRange]);

  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRev = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const avgBill = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
    const uniqueCustomers = new Set(filteredOrders.map((o) => o.customerName || o.id)).size;

    // Popular products counter
    const itemsCount: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((item: any) => {
        const cleanName = item.name.split(" (")[0];
        itemsCount[cleanName] = (itemsCount[cleanName] || 0) + item.qty;
      });
    });

    const sortedProducts = Object.entries(itemsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { totalOrders, totalRev, avgBill, uniqueCustomers, sortedProducts };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    const now = new Date();

    if (timeRange === "today") {
      // Group by hour
      for (let i = 8; i <= 21; i++) {
        const hourStr = `${String(i).padStart(2, "0")}:00`;
        dataMap[hourStr] = 0;
      }
      filteredOrders.forEach((o) => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        const hourStr = `${String(d.getHours()).padStart(2, "0")}:00`;
        if (dataMap[hourStr] !== undefined) {
          dataMap[hourStr] = (dataMap[hourStr] || 0) + o.total;
        }
      });
    } else if (timeRange === "7days") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        dataMap[dateStr] = 0;
      }
      filteredOrders.forEach((o) => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] = (dataMap[dateStr] || 0) + o.total;
        }
      });
    } else if (timeRange === "30days") {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        dataMap[dateStr] = 0;
      }
      filteredOrders.forEach((o) => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] = (dataMap[dateStr] || 0) + o.total;
        }
      });
    } else {
      // All - sort dates ascending
      filteredOrders
        .slice()
        .reverse()
        .forEach((o) => {
          if (!o.created_at) return;
          const d = new Date(o.created_at);
          const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
          dataMap[dateStr] = (dataMap[dateStr] || 0) + o.total;
        });
    }

    return Object.entries(dataMap).map(([name, value]) => ({ name, value }));
  }, [filteredOrders, timeRange]);

  if (loading) {
    return (
      <div className="text-center py-20 font-bold text-gray-500">กำลังดาวน์โหลดข้อมูลการขาย...</div>
    );
  }

  const rangeOptions: { id: typeof timeRange; label: string }[] = [
    { id: "all", label: "ทั้งหมด" },
    { id: "today", label: "วันนี้" },
    { id: "7days", label: "7 วันล่าสุด" },
    { id: "30days", label: "30 วันล่าสุด (1 เดือน)" },
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-[#ece4d6] p-3.5 rounded-[22px] gap-3 shadow-sm">
        <span className="text-xs font-black text-[#002e47]">
          📅 เลือกช่วงเวลาสรุปข้อมูลแดชบอร์ด:
        </span>
        <div className="flex flex-wrap gap-1">
          {rangeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTimeRange(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                timeRange === opt.id
                  ? "bg-[#002e47] text-white shadow-sm"
                  : "bg-slate-50 text-[#5a6e7a] hover:text-[#002e47] hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              {stats.totalOrders}
            </span>
            <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-500">
              <ClipboardList size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">
            ยอดสั่งซื้อสะสม (ออเดอร์)
          </span>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              ฿{new Intl.NumberFormat("th-TH").format(stats.totalRev)}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-500">
              <DollarSign size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">
            รายได้สะสมทั้งหมด (บาท)
          </span>
        </div>

        {/* Total Guests Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              {stats.uniqueCustomers}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-500">
              <Users size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">ลูกค้าสะสมทั้งหมด (คน)</span>
        </div>

        {/* Top Dish Name Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-black text-[#002e47] tracking-tight line-clamp-2 max-w-[80%] leading-tight pt-1">
              {stats.sortedProducts[0]?.name || "ไม่มีข้อมูล"}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-500 shrink-0">
              <TrendingUp size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">เมนูยอดนิยมอันดับ 1</span>
        </div>

        {/* Avg Bill Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              ฿{stats.avgBill}
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-500">
              <Flame size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">ยอดเฉลี่ยต่อบิล (บาท)</span>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Chart + Table) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Trend Line Chart */}
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm text-[#002e47] flex items-center gap-1.5">
                <TrendingUp size={16} className="text-emerald-500" />
                <span>กราฟแนวโน้มรายได้การขาย</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold">
                รวมรายได้: ฿{new Intl.NumberFormat("th-TH").format(stats.totalRev)}
              </span>
            </div>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#002e47" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#002e47" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1ebe4" />
                  <XAxis
                    dataKey="name"
                    stroke="#5a6e7a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#5a6e7a" fontSize={10} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #ece4d6",
                      borderRadius: "16px",
                      fontSize: "11px",
                      fontFamily: "sans-serif",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                    formatter={(value) => [
                      `฿${new Intl.NumberFormat("th-TH").format(Number(value))}`,
                      "ยอดขาย",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#002e47"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5 Recent Orders (Table styled like screenshot) */}
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm">
            <h3 className="font-black text-sm text-[#002e47] mb-4">🧾 5 ออเดอร์ล่าสุด</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pb-3">ออเดอร์</th>
                    <th className="py-2.5 pb-3">เวลา</th>
                    <th className="py-2.5 pb-3">ประเภท</th>
                    <th className="py-2.5 pb-3 text-right">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        ไม่มีข้อมูลออเดอร์ในช่วงเวลานี้
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice(0, 5).map((o) => {
                      const isDineIn = o.orderType === "dine-in";
                      const isTakeaway = o.orderType === "takeaway";

                      let badgeLabel = "เดลิเวอรี่";
                      let badgeColor = "bg-blue-50 text-blue-800 border-blue-100";
                      if (isDineIn) {
                        badgeLabel = o.tableNumber ? `โต๊ะ ${o.tableNumber}` : "ทานที่ร้าน";
                        badgeColor = "bg-amber-50 text-amber-800 border-amber-100";
                      } else if (isTakeaway) {
                        badgeLabel = "กลับบ้าน";
                        badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                      }

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/40 transition">
                          <td className="py-3.5 font-black text-[#002e47]">{o.orderNumber}</td>
                          <td className="py-3.5 text-slate-400">
                            {o.date.includes(" · ") ? o.date.split(" · ")[1] : o.date}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${badgeColor}`}
                            >
                              {badgeLabel}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-black text-[#002e47]">
                            ฿{o.total}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5 Recent Customers list */}
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm">
            <h3 className="font-black text-sm text-[#002e47] mb-4">👥 5 รายชื่อลูกค้าล่าสุด</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pb-3">ชื่อลูกค้า</th>
                    <th className="py-2.5 pb-3">ช่องทาง/โต๊ะ</th>
                    <th className="py-2.5 pb-3 text-right">เวลาเข้าใช้งาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                        ไม่มีรายชื่อลูกค้าใหม่
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice(0, 5).map((o, idx) => {
                      const isDineIn = o.orderType === "dine-in";
                      return (
                        <tr key={idx} className="hover:bg-slate-50/40 transition">
                          <td className="py-3.5 font-black text-[#002e47]">
                            {o.customerName || "คุณลูกค้า"}
                          </td>
                          <td className="py-3.5 text-slate-500 font-bold">
                            {isDineIn
                              ? `ทานที่ร้าน (โต๊ะ ${o.tableNumber || "-"})`
                              : o.orderType === "takeaway"
                                ? "กลับบ้าน (Takeaway)"
                                : "จัดส่ง (Delivery)"}
                          </td>
                          <td className="py-3.5 text-right text-slate-400">
                            {o.date.includes(" · ") ? o.date.split(" · ")[1] : o.date}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Top 5 Popular Dishes with progress bars) */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col h-full">
            <h3 className="font-black text-sm text-[#002e47] mb-4 flex items-center gap-1.5">
              <span>📊 5 อันดับเมนูขายดีที่สุด</span>
            </h3>

            <div className="space-y-6 flex-1">
              {stats.sortedProducts.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-16 text-center">
                  ไม่มีข้อมูลยอดขายเมนู
                </p>
              ) : (
                stats.sortedProducts.slice(0, 5).map((p, idx) => {
                  const maxCount = stats.sortedProducts[0]?.count || 1;
                  const ratio = Math.max(8, Math.round((p.count / maxCount) * 100));

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-[#002e47]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center font-black text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[140px]">{p.name}</span>
                        </div>
                        <span className="text-[#002e47]">{p.count} จาน</span>
                      </div>

                      {/* Dark Blue Progress bar */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#002e47] h-full rounded-full transition-all duration-500"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
