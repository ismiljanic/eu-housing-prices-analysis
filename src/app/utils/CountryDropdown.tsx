import { useState, useRef, useEffect } from "react";

export function CountryDropdown({
  countries,
  selectedCountry,
  onChange
}: {
  countries: string[];
  selectedCountry: string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left w-40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 flex justify-between items-center"
      >
        {selectedCountry}
        <span className={`ml-2 transition-transform ${open ? "rotate-180" : ""}`}>&#9662;</span>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {countries.map(c => (
            <li
              key={c}
              onClick={() => { onChange(c); setOpen(false); }}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}