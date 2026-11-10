import { UploadCloud } from "lucide-react";

export default function AudioUploader({ onUpload }) {
  return (
    <label className="flex flex-col items-center justify-center gap-3 w-full py-12 rounded-2xl border-2 border-dashed border-fuchsia-300 bg-gradient-to-br from-fuchsia-50 via-white to-cyan-50 text-gray-500 hover:border-fuchsia-400 hover:shadow-inner transition cursor-pointer">
      <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-lg flex items-center justify-center text-white">
        <UploadCloud size={28} />
      </span>

      <span className="text-sm font-semibold text-gray-700">
        Tap to upload an MP3
      </span>

      <input
        type="file"
        accept=".mp3,audio/mpeg"
        onChange={(e) => onUpload(e.target.files[0])}
        className="hidden"
      />
    </label>
  );
}
