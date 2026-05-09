// components/pipeline/PipelineCard.tsx
import { MdAutoAwesome } from "react-icons/md";
import { PipelineItem } from "./PipelineColumn";

export default function PipelineCard({ item }: { item: PipelineItem }) {
  const getDaysColor = () => {
    if (item.daysLeft <= 3) return "bg-red-100 text-red-600";
    if (item.daysLeft <= 7) return "bg-orange-100 text-orange-600";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3 hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <p className="text-[11px] font-bold text-slate-400">{item.ref}</p>

        <span className="bg-[#006b5f]/10 text-[#006b5f] border border-[#006b5f]/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
          <div className="flex items-center gap-1">
            <MdAutoAwesome /> {item.match}% MATCH
          </div>
        </span>
      </div>

      <h3 className="font-semibold text-[#1e3a8a] leading-snug">
        {item.title}
      </h3>

      <p className="text-xs text-slate-500">{item.organization}</p>

      <div className="flex justify-between items-center pt-2">
        <div>
          <p className="text-[10px] text-slate-400">BUDGET</p>
          <p className="text-sm font-bold">{item.budget}</p>
        </div>

        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${getDaysColor()}`}
        >
          {item.daysLeft} Days
        </span>
      </div>
    </div>
  );
}
/*{
                "on-tertiary-fixed-variant": "#653e00",
                "on-tertiary-container": "#ef9900",
                "tertiary-fixed": "#ffddb8",
                "secondary-fixed-dim": "#4fdbc8",
                "on-error-container": "#93000a",
                "surface-bright": "#f9f9ff",
                "on-secondary-fixed": "#00201c",
                "on-secondary-container": "#006f64",
                "primary-container": "#1e3a8a",
                "tertiary-container": "#5c3800",
                "primary-fixed": "#dce1ff",
                "inverse-surface": "#2a313d",
                "surface-container-lowest": "#ffffff",
                "inverse-on-surface": "#ebf1ff",
                "surface-tint": "#4059aa",
                "surface-container": "#e7eefe",
                "on-surface-variant": "#444651",
                "background": "#f9f9ff",
                "on-surface": "#151c27",
                "surface": "#f9f9ff",
                "on-tertiary-fixed": "#2a1700",
                "on-primary-fixed-variant": "#264191",
                "tertiary": "#3e2400",
                "surface-container-high": "#e2e8f8",
                "on-secondary-fixed-variant": "#005048",
                "primary": "#00236f",
                "on-primary-fixed": "#00164e",
                "on-background": "#151c27",
                "on-error": "#ffffff",
                "surface-variant": "#dce2f3",
                "surface-container-low": "#f0f3ff",
                "error-container": "#ffdad6",
                "secondary-fixed": "#71f8e4",
                "tertiary-fixed-dim": "#ffb95f",
                "on-primary-container": "#90a8ff",
                "secondary": "#006b5f",
                "inverse-primary": "#b6c4ff",
                "secondary-container": "#6df5e1",
                "outline-variant": "#c5c5d3",
                "outline": "#757682",
                "surface-dim": "#d3daea",
                "primary-fixed-dim": "#b6c4ff",
                "on-primary": "#ffffff",
                "error": "#ba1a1a",
                "on-secondary": "#ffffff",
                "surface-container-highest": "#dce2f3",
                "on-tertiary": "#ffffff"
            }, */
