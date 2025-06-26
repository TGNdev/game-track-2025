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
      className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto"
    >
      {filtered.map((item, idx) => (
        <div
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
            setVisible(false);
          }}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        >
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500">{item.link}</div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionDropdown;
