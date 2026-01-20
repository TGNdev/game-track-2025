import React, { useEffect, useState, useRef } from "react";

const SuggestionDropdown = ({ suggestions, value, onSelect, anchorRef }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [filtered, setFiltered] = useState([]);
  const [visible, setVisible] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered([]);
      setVisible(false);
      return;
    }

    const filteredSuggestions = suggestions.filter((sugg) =>
      sugg.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFiltered(filteredSuggestions);
    setVisible(filteredSuggestions.length > 0);
  }, [searchTerm, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        setVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [anchorRef]);

  if (!visible) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-[110] mt-2 w-full bg-black/70 border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-60 custom-scrollbar py-2"
    >
      {filtered.map((item, idx) => (
        <div
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
            setVisible(false);
          }}
          className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-none"
        >
          <div className="font-bold text-white text-sm">{item.name}</div>
          <div className="text-[10px] text-white/40 truncate">{item.link}</div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionDropdown;
