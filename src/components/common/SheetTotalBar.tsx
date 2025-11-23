"use client";
import React from "react";

export default function SheetTotalBar({
  data,
}: {
  data: { label: string; value: string | number; color?: string }[];
}) {
  return (
    <div className="flex justify-between bg-ocean/10 border border-ocean/20 text-sm text-center rounded-xl px-3 py-2 mb-3">
      {data.map((item, i) => (
        <div key={i} className="flex-1 text-center">
          <p className="text-gray-500 text-xs">{item.label}</p>
          <p className={`font-semibold ${item.color || "text-ocean"}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
