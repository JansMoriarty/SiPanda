import { useState, useEffect } from "react";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Avatar({
  src,
  name,
  className = "h-9 w-9",
  textClass = "text-xs",
  fallbackClassName = "bg-[#465FFF]",
  fallbackStyle,
}) {
  const [failed, setFailed] = useState(false);

  // reset kalau src berubah (misal habis upload foto baru)
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-full object-cover shadow-sm`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      style={fallbackStyle}
      className={`${className} ${textClass} flex shrink-0 select-none items-center justify-center rounded-full ${fallbackClassName} font-semibold text-white shadow-sm`}
    >
      {getInitials(name)}
    </span>
  );
}