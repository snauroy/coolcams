"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, Category } from "@/types/camera";

const FILTERS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "compact", label: "Compact" },
  { value: "rangefinder", label: "Rangefinder" },
  { value: "slr", label: "SLR" },
  { value: "medium-format", label: "Medium Format" },
  { value: "toy", label: "Toy" },
];

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Easy",
  intermediate: "Mid",
  advanced: "Hard",
};

export default function CameraGrid({ cameras }: { cameras: Camera[] }) {
  const [active, setActive] = useState<Category | "all">("all");

  const filtered =
    active === "all" ? cameras : cameras.filter((c) => c.category === active);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex border border-black mb-10 overflow-x-auto">
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? cameras.length
              : cameras.filter((c) => c.category === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setActive(f.value)}
              className={`flex-shrink-0 px-5 py-3 font-mono text-[11px] uppercase tracking-widest border-r border-black last:border-r-0 transition-colors ${
                active === f.value
                  ? "bg-black text-white"
                  : "bg-[#FAFAF8] text-black hover:bg-zinc-100"
              }`}
            >
              {f.label}
              <span className="ml-2 opacity-40">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black border border-black">
        {filtered.map((camera) => (
          <CameraCard key={camera.id} camera={camera} />
        ))}
      </div>

      <p className="font-mono text-[11px] text-zinc-400 mt-6 uppercase tracking-widest">
        {filtered.length} camera{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function CameraCard({ camera }: { camera: Camera }) {
  return (
    <Link href={`/cameras/${camera.id}`} className="group bg-[#FAFAF8] block">
      {/* Image */}
      <div className="aspect-[4/3] bg-zinc-100 overflow-hidden border-b border-black relative">
        {camera.wikiImage ? (
          <Image
            src={`/cameras/${camera.wikiImage}`}
            alt={camera.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300">
              {camera.brand}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 group-hover:bg-black group-hover:text-white transition-colors duration-200">
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500">
            {camera.category.replace("-", " ")} · {camera.format}
          </span>
          <span className="font-mono text-[10px] text-zinc-400 group-hover:text-zinc-500 whitespace-nowrap ml-2">
            {camera.years}
          </span>
        </div>

        <h2
          className="text-xl font-bold leading-tight mb-3"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          {camera.name}
        </h2>

        <p className="text-sm text-zinc-500 group-hover:text-zinc-400 line-clamp-2 leading-relaxed mb-5">
          {camera.vibe}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-zinc-400 group-hover:text-zinc-500">
            {camera.marketPrice}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-zinc-300 text-zinc-400 group-hover:border-zinc-600 group-hover:text-zinc-500 transition-colors">
            {DIFFICULTY_LABEL[camera.difficulty]}
          </span>
        </div>
      </div>
    </Link>
  );
}
