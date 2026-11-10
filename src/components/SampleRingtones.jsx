import { PlayCircle } from "lucide-react";
import { SAMPLE_RINGTONES } from "../utils/sampleRingtones";

export default function SampleRingtones() {
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold text-gray-500 mb-2">
        Or grab some popular songs from here
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SAMPLE_RINGTONES.map((preset) => (
          <a
            key={preset.id}
            href={preset.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-fuchsia-300 hover:bg-fuchsia-50 shadow-sm transition"
          >
            <span>{preset.name}</span>
            <PlayCircle size={16} className="text-red-500" />
          </a>
        ))}
      </div>
    </div>
  );
}
