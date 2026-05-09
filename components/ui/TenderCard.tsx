"use client";

type Props = {
  id?: string;
  title?: string;
  organization?: string;
  budget?: string;
  deadline?: string;
  score?: number;
};

export default function TenderCard({
  id,
  title,
  organization,
  budget,
  deadline,
  score,
}: Props) {
  return (
    <div className="bg-white p-10 rounded-xl border border-gray-300 hover:shadow-md transition">
      {/* Top */}
      <div className="flex justify-between items-start">
        <span className="text-[10px] text-[#757682] bg-slate-100 py-1 px-2 font-bold">
          {id}
        </span>
        <div className="">
          <div className="text-[#006b5f] font-bold text-3xl text-center">
            {score}%
          </div>
          <div className="text-[8px] font-bold uppercase text-[#006b5f] ">
            match score
          </div>
        </div>
      </div>

      {/* Title */}
      <h4 className="mt-3 mb-2 font-bold text-lg text-[#00236f] capitalize">
        {title}
      </h4>

      <p className="text-base text-[#757682] mb-4 capitalize">{organization}</p>
      <div className="border-b border-gray-200 py-2"></div>
      {/* Bottom */}
      <div className="flex justify-between mt-4 text-sm">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold text-[#757682] uppercase">
            budget
          </div>
          <span className="text-[#151c27] capitalize font-bold text-base">
            {budget}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold text-[#757682] uppercase">
            due in
          </div>
          <span className="text-[#ba1a1a] capitalize font-bold text-base">
            {deadline}
          </span>
        </div>
      </div>
    </div>
  );
}
