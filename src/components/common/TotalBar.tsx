"use client";
import React from "react";

export default function TotalBar({
  data,
}: {
  data: { label: string; value: number | string; color?: string }[];
}) {
  return (
    <div className="bg-ocean/10 border border-ocean/20 rounded-2xl p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shadow-sm">
      {data.map((item, i) => (
        <div key={i}>
          <p className="text-xs text-gray-500">{item.label}</p>
          <p
            className={`text-lg font-semibold ${
              item.color || "text-ocean"
            } whitespace-nowrap`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
