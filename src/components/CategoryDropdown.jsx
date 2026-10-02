import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import * as kategoriService from "../services/kategoriService"

export function CategoryDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef(null)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const data = await kategoriService.getCategories()
        const categoryList = Array.isArray(data) ? data : []
        setCategories(categoryList)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategories()
  }, [])

  const currentLabel = categories.find(cat => {
    const categoryId = cat.id ?? cat.id_kategori
    return categoryId === value || categoryId === Number(value)
  })?.nama_kategori || "Pilih Kategori"

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
    <div ref={dropdownRef} className="relative inline-block w-full">
      {/* Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/50 hover:bg-white/60 backdrop-blur-md border border-white/30 rounded-lg transition-all duration-200 text-gray-700 font-medium text-sm hover:shadow-md"
      >
        <span>{loading ? "Memuat..." : currentLabel}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Options */}
          <div className="py-1">
            {categories.length > 0 ? (
              categories.map((category) => {
                const categoryId = category.id ?? category.id_kategori
                return (
                  <button
                    key={categoryId}
                    type="button"
                    onClick={() => {
                      onChange(categoryId)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150 ${
                      value === categoryId || value === String(categoryId)
                        ? "bg-blue-100/50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100/50"
                    }`}
                  >
                    <span>{category.nama_kategori}</span>
                    {(value === categoryId || value === String(categoryId)) && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-2.5 text-center text-sm text-gray-500">
                Tidak ada kategori
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
