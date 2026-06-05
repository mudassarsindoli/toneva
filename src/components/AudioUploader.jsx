export default function AudioUploader({
  onUpload,
}) {
  return (
    <input
      type="file"
      accept=".mp3,audio/mpeg"
      onChange={(e) =>
        onUpload(e.target.files[0])
      }
      className="w-full border p-3 rounded"
    />
  );
}