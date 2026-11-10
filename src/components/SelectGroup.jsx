export default function SelectGroup({
  label,
  icon,
  value,
  options,
  onChange,
  activeClass = "bg-gray-900 text-white",
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
        {icon}
        {label}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 min-w-[3.2rem] py-2 rounded-xl text-sm font-semibold transition shadow-sm ${
              value === opt.value
                ? activeClass
                : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
