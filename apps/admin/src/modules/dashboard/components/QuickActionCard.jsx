import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  path,
}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="group rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
        <Icon size={22} />
      </div>

      <div className="text-base font-black text-slate-950">{title}</div>

      <div className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-slate-900">
        Open
        <ArrowRight
          size={16}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}