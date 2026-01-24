import React, { forwardRef } from "react";

const GameTag = forwardRef(({ tag, variant = "pill", size = "sm", className = "", style = {} }, ref) => {
  if (!tag) return null;

  const isRotated = variant === "rotated";
  const sizeStyle = size === "md" ? "px-3 py-1" : "px-2 py-0.5";
  let baseStyle = `${sizeStyle} text-[10px] uppercase font-black rounded-lg shadow-lg whitespace-nowrap`;

  if (isRotated) {
    baseStyle += " transform -rotate-12";
  }

  const finalStyle = isRotated
    ? { transformOrigin: "left top", ...style }
    : style;

  return (
    <div
      ref={ref}
      className={`${tag.color} ${baseStyle} ${isRotated ? "absolute" : ""} ${className}`}
      style={finalStyle}
      title={tag.label}
    >
      {tag.label}
    </div>
  );
});

GameTag.displayName = "GameTag";

export default GameTag;
