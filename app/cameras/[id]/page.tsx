import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import camerasData from "@/data/cameras.json";
import { Camera } from "@/types/camera";

const cameras = camerasData as Camera[];

export function generateStaticParams() {
  return cameras.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const camera = cameras.find((c) => c.id === id);
  if (!camera) return {};
  return {
    title: `${camera.name} — CoolCams`,
    description: camera.vibe.slice(0, 155),
  };
}

export default async function CameraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const camera = cameras.find((c) => c.id === id);
  if (!camera) notFound();

  const idx = cameras.findIndex((c) => c.id === id);
  const prev = cameras[idx - 1] ?? null;
  const next = cameras[idx + 1] ?? null;

  return (
    <main className="min-h-screen">
      {/* Top nav */}
      <div className="border-b border-black px-6 md:px-12 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-widest hover:underline"
        >
          ← CoolCams
        </Link>
        <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-widest">
          {idx + 1} / {cameras.length}
        </span>
      </div>

      <div className="px-6 md:px-12 py-10 max-w-5xl">
        {/* Image */}
        <div className="aspect-[16/9] bg-zinc-100 border border-black overflow-hidden relative mb-10">
          {camera.wikiImage ? (
            <Image
              src={`/cameras/${camera.wikiImage}`}
              alt={camera.name}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 900px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-300">
                {camera.brand} — {camera.name}
              </span>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="font-mono text-[11px] uppercase tracking-widest border border-black px-3 py-1">
            {camera.category.replace("-", " ")}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest border border-black px-3 py-1">
            {camera.format}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest border border-black px-3 py-1">
            {camera.years}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest border border-black px-3 py-1">
            {camera.difficulty}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-5xl md:text-6xl font-bold tracking-tighter leading-none mb-8"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          {camera.name}
        </h1>

        <hr className="border-black mb-8" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Left: vibe + cultural note */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-3">
              Character
            </p>
            <p className="text-base leading-relaxed text-zinc-700 mb-8">
              {camera.vibe}
            </p>

            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-3">
              Context
            </p>
            <p className="text-base leading-relaxed text-zinc-700 mb-8">
              {camera.culturalNote}
            </p>

            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-3">
              Best for
            </p>
            <div className="flex flex-wrap gap-2">
              {camera.bestFor.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[11px] uppercase tracking-wider border border-black px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: specs */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-3">
              Specs
            </p>
            <table className="w-full text-sm border border-black">
              <tbody>
                {camera.lens && (
                  <SpecRow
                    label="Lens"
                    value={`${camera.lens.focal}mm f/${camera.lens.aperture} ${camera.lens.maker}${camera.lens.model ? ` ${camera.lens.model}` : ""}`}
                  />
                )}
                <SpecRow label="Shutter" value={camera.specs.shutter} />
                <SpecRow label="Metering" value={camera.specs.metering} />
                <SpecRow label="Focus" value={camera.specs.focus} />
                <SpecRow label="Film speeds" value={camera.specs.filmSpeeds} />
              </tbody>
            </table>

            <div className="mt-8 border border-black p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
                Market price
              </p>
              <p
                className="text-3xl font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {camera.marketPrice}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-black mb-8" />

        {/* Prev / Next navigation */}
        <div className="grid grid-cols-2 gap-px bg-black border border-black">
          <div className="bg-[#FAFAF8] p-5">
            {prev ? (
              <Link href={`/cameras/${prev.id}`} className="group block">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  ← Previous
                </p>
                <p
                  className="font-bold text-lg group-hover:underline"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {prev.name}
                </p>
              </Link>
            ) : (
              <span className="font-mono text-[10px] text-zinc-300 uppercase tracking-widest">
                First camera
              </span>
            )}
          </div>
          <div className="bg-[#FAFAF8] p-5 text-right">
            {next ? (
              <Link href={`/cameras/${next.id}`} className="group block">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  Next →
                </p>
                <p
                  className="font-bold text-lg group-hover:underline"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {next.name}
                </p>
              </Link>
            ) : (
              <span className="font-mono text-[10px] text-zinc-300 uppercase tracking-widest">
                Last camera
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-black last:border-b-0">
      <td className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 py-3 px-4 border-r border-black w-1/3 align-top">
        {label}
      </td>
      <td className="py-3 px-4 text-sm leading-relaxed">{value}</td>
    </tr>
  );
}
