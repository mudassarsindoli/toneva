export default function Controls({
  form,
  setForm,
  process,
  loading,
}) {
  return (
    <div className="grid gap-4">

      <input
        type="number"
        placeholder="Start Time"
        value={form.start}
        onChange={(e)=>
          setForm({
            ...form,
            start:e.target.value
          })
        }
      />

      <input
        type="number"
        placeholder="End Time"
        value={form.end}
        onChange={(e)=>
          setForm({
            ...form,
            end:e.target.value
          })
        }
      />

      <input
        type="number"
        placeholder="Fade In (sec)"
        value={form.fadeIn}
        onChange={(e)=>
          setForm({
            ...form,
            fadeIn:e.target.value
          })
        }
      />

      <input
        type="number"
        placeholder="Fade Out (sec)"
        value={form.fadeOut}
        onChange={(e)=>
          setForm({
            ...form,
            fadeOut:e.target.value
          })
        }
      />

      <button
        onClick={process}
        disabled={loading}
        className="bg-black text-white p-3 rounded"
      >
        {loading
          ? "Processing..."
          : "Generate MP3"}
      </button>

    </div>
  );
}