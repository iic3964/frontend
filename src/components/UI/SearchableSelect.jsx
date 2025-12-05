import { useState, useRef, useEffect } from "react";

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  label,
  required = false,
  disabled = false,
  renderOption = (opt) => opt.label,
  filterOption = (opt, search) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = search
    ? options.filter((opt) => filterOption(opt, search))
    : options;

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      {label && (
        <label className="text-sm text-health-text-muted">
          {label} {required && "*"}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setTimeout(() => inputRef.current?.focus(), 100);
              }
            }
          }}
          disabled={disabled}
          className={`w-full rounded-lg bg-white border border-health-border px-3 py-2 text-left text-health-text h-10 flex items-center justify-between transition ${
            disabled ? "bg-gray-100 opacity-70 cursor-not-allowed" : "hover:border-health-accent cursor-pointer"
          }`}
        >
          <span className={selectedOption ? "" : "text-gray-400"}>
            {selectedOption ? renderOption(selectedOption) : placeholder}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-health-border rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 border border-health-border rounded-md text-sm outline-none focus:ring-2 focus:ring-health-accent"
              />
            </div>

            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition hover:bg-health-accent hover:text-white ${
                      option.value === value ? "bg-health-accent-light text-health-accent font-medium" : ""
                    }`}
                  >
                    {renderOption(option)}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
