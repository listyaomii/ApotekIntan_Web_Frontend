import { useEffect } from "react"
import { Check, AlertCircle } from "lucide-react"

export function Toast({ message, type = "success", isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={`flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg backdrop-blur-xl border ${
        type === "success"
          ? "bg-green-500/90 border-green-400/50 text-black"
          : "bg-red-500/90 border-red-400/50 text-black"
      }`}>
        {type === "success" ? (
          <Check size={20} className="flex-shrink-0" />
        ) : (
          <AlertCircle size={20} className="flex-shrink-0" />
        )}
        <span className="font-semibold text-sm">{message}</span>
      </div>
    </div>
  )
}
