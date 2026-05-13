export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black text-slate-400">{title}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>
          {subtitle ? (
            <div className="mt-2 text-xs font-bold text-slate-500">
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            tones[tone] || tones.default
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}