import { useEffect, useRef, useState } from "react";

export default function SingleRangeSlider({
  min,
  max,
  value,
  onChange,
  format,
  thumbClass = "border-fuchsia-500",
  fillClass = "bg-fuchsia-500",
}) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pctFor = (val) => (max > min ? ((val - min) / (max - min)) * 100 : 0);

  const valueFromClientX = (clientX) => {
    const track = trackRef.current;
    if (!track) return min;

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

    return min + ratio * (max - min);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      onChange(valueFromClientX(clientX));
    };

    const handleUp = () => setDragging(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, min, max]);

  const label = format || ((v) => v);

  return (
    <div>
      <div className="text-center text-xs font-bold text-gray-600 mb-3">
        {label(value)}
      </div>

      <div
        ref={trackRef}
        className="relative h-6 flex items-center touch-none"
        onPointerDown={(e) => {
          onChange(valueFromClientX(e.clientX));
          setDragging(true);
        }}
      >
        <div className="absolute left-0 right-0 h-2 rounded-full bg-gray-200" />

        <div
          className={`absolute left-0 h-2 rounded-full ${fillClass}`}
          style={{ width: `${pctFor(value)}%` }}
        />

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            setDragging(true);
          }}
          className={`absolute w-6 h-6 -translate-x-1/2 rounded-full bg-white border-[3px] ${thumbClass} shadow-md touch-none cursor-grab active:cursor-grabbing active:scale-110 transition-transform`}
          style={{ left: `${pctFor(value)}%` }}
        />
      </div>
    </div>
  );
}
