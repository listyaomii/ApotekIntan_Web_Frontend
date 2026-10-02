import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

export function SortDropdown({ sort, setSort }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const sortOptions = [
    { value: "expired_asc", label: "Expired Terdekat" },
    { value: "expired_desc", label: "Expired Terlama" },
  ]

  const currentLabel = sortOptions.find(opt => opt.value === sort)?.label || "Sort"

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/30 hover:bg-white/40 backdrop-blur-md border border-white/20 rounded-lg transition-all duration-200 text-gray-700 font-medium text-sm hover:shadow-md"
      >
        <span>{currentLabel}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/20 bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-base font-semibold text-gray-600 uppercase tracking-wider">Sort Produk</p>
          </div>

          {/* Options */}
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSort(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-base font-medium transition-colors duration-150 ${
                  sort === option.value
                    ? "bg-blue-100/50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                <span>{option.label}</span>
                {sort === option.value && (
                  <Check size={16} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}