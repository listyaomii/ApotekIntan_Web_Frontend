import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function PageShell({ title, subtitle, isOpen, setIsOpen, active, children, rightSlot }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#8cce90]/40 via-[#5ec9aa]/30 to-[#29795a]/40 backdrop-blur-xl">
      <Sidebar isOpen={isOpen} active={active} />

      <div className="flex-1 p-8 text-[#071307]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition"
            >
              <Menu />
            </button>
            <div>
              {subtitle && <p className="text-lg text-[#29795a]">{subtitle}</p>}
              <h1 className="text-3xl font-bold">{title}</h1>
            </div>
          </div>

          {rightSlot && (
            <div className="flex flex-wrap items-center gap-3">
              {rightSlot}
            </div>
          )}
        </div>

        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}