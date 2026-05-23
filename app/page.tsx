import camerasData from "@/data/cameras.json";
import { Camera } from "@/types/camera";
import CameraGrid from "@/components/CameraGrid";

const cameras = camerasData as Camera[];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-black px-6 py-8 md:px-12">
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              COOLCAMS
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              The finest film cameras ever made
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-400 hidden md:block">
            {cameras.length} cameras
          </span>
        </div>
      </header>

      <div className="px-6 md:px-12 py-10">
        <CameraGrid cameras={cameras} />
      </div>
    </main>
  );
}
