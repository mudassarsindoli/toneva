import { useEffect, useRef, useState } from "react";

export default function DualRangeSlider({
  min,
  max,
  start,
  end,
  onChange,
  format,
}) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const pctFor = (value) =>
    max > min ? ((value - min) / (max - min)) * 100 : 0;

  const valueFromClientX = (clientX) => {
    const track = trackRef.current;
    if (!track) return min;

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width)
    );

    return min + ratio * (max - min);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const value = valueFromClientX(clientX);

      if (dragging === "start") {
        onChange(Math.min(value, end - 1), end);
      } else {
        onChange(start, Math.max(value, start + 1));
      }
    };

    const handleUp = () => setDragging(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, start, end, min, max]);

  const label = format || ((v) => v);

  return (
    <div className="pt-3 pb-1">
      <div className="flex justify-between text-xs font-bold text-gray-500 mb-4">
        <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700">
          {label(start)}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
          {label(end)}
        </span>
      </div>

      <div ref={trackRef} className="relative h-6 flex items-center touch-none">
        <div className="absolute left-0 right-0 h-2 rounded-full bg-gray-200" />

        <div
          className="absolute h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500"
          style={{
            left: `${pctFor(start)}%`,
            right: `${100 - pctFor(end)}%`,
          }}
        />

        <button
          type="button"
          aria-label="Start"
          onPointerDown={() => setDragging("start")}
          className="absolute w-6 h-6 -translate-x-1/2 rounded-full bg-white border-[3px] border-fuchsia-500 shadow-md touch-none cursor-grab active:cursor-grabbing active:scale-110 transition-transform"
          style={{ left: `${pctFor(start)}%` }}
        />

        <button
          type="button"
          aria-label="End"
          onPointerDown={() => setDragging("end")}
          className="absolute w-6 h-6 -translate-x-1/2 rounded-full bg-white border-[3px] border-cyan-500 shadow-md touch-none cursor-grab active:cursor-grabbing active:scale-110 transition-transform"
          style={{ left: `${pctFor(end)}%` }}
        />
      </div>
    </div>
  );
}
