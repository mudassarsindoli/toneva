import { useEffect, useRef, useState } from "react";
import AudioUploader from "./components/AudioUploader";
import { trimAudio } from "./utils/ffmpegService";

function App() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [duration, setDuration] = useState(300);

  const [form, setForm] = useState({
    start: 0,
    end: 30,
    fadeIn: 2,
    fadeOut: 2,
    bass: 6,
    treble: 0,
    speed: 1,
  });

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const bassFilterRef = useRef(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const formatTime = (seconds) => {
    const mins = Math.floor(
      seconds / 60
    );

    const secs = Math.floor(
      seconds % 60
    );

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  useEffect(() => {
    if (!audioUrl || !audioRef.current)
      return;

    const audio = audioRef.current;

    const initialize =
      async () => {
        if (
          audioContextRef.current
        )
          return;

        const ctx =
          new AudioContext();

        const source =
          ctx.createMediaElementSource(
            audio
          );

        const bass =
          ctx.createBiquadFilter();

        bass.type = "lowshelf";
        bass.frequency.value = 200;

        source.connect(bass);
        bass.connect(
          ctx.destination
        );

        audioContextRef.current =
          ctx;

        sourceRef.current = source;

        bassFilterRef.current =
          bass;
      };

    initialize();

    const updateTime = () => {
      setCurrentTime(
        audio.currentTime
      );
    };

    audio.addEventListener(
      "timeupdate",
      updateTime
    );

    return () => {
      audio.removeEventListener(
        "timeupdate",
        updateTime
      );
    };

  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    // Speed Preview
    audio.playbackRate = form.speed;

    // Bass Preview
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value =
        form.bass;
    }

    // Keep playback inside selected trim range
    if (
      audio.currentTime < form.start ||
      audio.currentTime > form.end
    ) {
      audio.currentTime = form.start;
    }

    const handleTimeUpdate = () => {
      // Stop at trim end
      if (
        audio.currentTime >= form.end
      ) {
        audio.pause();
        audio.currentTime =
          form.start;

        setIsPlaying(false);
      }

      // Fade In Preview
      if (
        form.fadeIn > 0 &&
        audio.currentTime >= form.start &&
        audio.currentTime <=
        form.start + form.fadeIn
      ) {
        const progress =
          (audio.currentTime -
            form.start) /
          form.fadeIn;

        audio.volume =
          Math.min(
            1,
            Math.max(0, progress)
          );
      }

      // Fade Out Preview
      else if (
        form.fadeOut > 0 &&
        audio.currentTime >=
        form.end -
        form.fadeOut
      ) {
        const progress =
          (form.end -
            audio.currentTime) /
          form.fadeOut;

        audio.volume =
          Math.min(
            1,
            Math.max(0, progress)
          );
      }

      else {
        audio.volume = 1;
      }
    };

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    return () => {
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.volume = 0.4;
    };
  }, [
    form.start,
    form.end,
    form.bass,
    form.speed,
    form.fadeIn,
    form.fadeOut,
  ]);

  const togglePlay = async () => {
    const audio =
      audioRef.current;

    if (!audio) return;

    if (
      audioContextRef.current
        ?.state === "suspended"
    ) {
      await audioContextRef.current.resume();
    }

    if (audio.paused) {
      audio.currentTime =
        form.start;

      audio.play();

      setIsPlaying(true);
    } else {
      audio.pause();

      setIsPlaying(false);
    }
  };

  const ringtonePresets = {
    classicRing: {
      label: "Classic Ring",
      icon: "📞",
      bass: 3,
      speed: 1,
      fadeIn: 0.1,
      fadeOut: 0.3,
    },

    loudAlert: {
      label: "Loud Alert",
      icon: "📢",
      bass: 8,
      speed: 1,
      fadeIn: 0,
      fadeOut: 0,
    },

    softPing: {
      label: "Soft Ping",
      icon: "🔔",
      bass: 1,
      speed: 0.95,
      fadeIn: 1,
      fadeOut: 2,
    },

    urgentBeep: {
      label: "Urgent Beep",
      icon: "🚨",
      bass: 6,
      speed: 1.2,
      fadeIn: 0,
      fadeOut: 0,
    },

    futuristicNotify: {
      label: "Futuristic Notify",
      icon: "🤖",
      bass: 4,
      speed: 1.15,
      fadeIn: 0.2,
      fadeOut: 0.5,
    },

    retroPhone: {
      label: "Retro Phone",
      icon: "☎️",
      bass: 5,
      speed: 0.9,
      fadeIn: 0.5,
      fadeOut: 1,
    },

    minimalTap: {
      label: "Minimal Tap",
      icon: "👆",
      bass: 0,
      speed: 1,
      fadeIn: 0,
      fadeOut: 0.2,
    },

    bassPunchRing: {
      label: "Bass Punch",
      icon: "🥊",
      bass: 12,
      speed: 1,
      fadeIn: 0,
      fadeOut: 0,
    },

    crystalChime: {
      label: "Crystal Chime",
      icon: "💎",
      bass: 2,
      speed: 1.05,
      fadeIn: 1,
      fadeOut: 1.5,
    },

    emergencyAlarm: {
      label: "Emergency Alarm",
      icon: "🚑",
      bass: 10,
      speed: 1.3,
      fadeIn: 0,
      fadeOut: 0,
    },

    vibroPulse: {
      label: "Vibro Pulse",
      icon: "📳",
      bass: 7,
      speed: 1,
      fadeIn: 0,
      fadeOut: 0.8,
    },

    nightModeSoft: {
      label: "Night Soft",
      icon: "🌙",
      bass: 2,
      speed: 0.9,
      fadeIn: 2,
      fadeOut: 2,
    },

    attentionGrabber: {
      label: "Attention Grabber",
      icon: "⚡",
      bass: 9,
      speed: 1.1,
      fadeIn: 0,
      fadeOut: 0,
    },

    deepToneRing: {
      label: "Deep Tone",
      icon: "🎧",
      bass: 11,
      speed: 0.95,
      fadeIn: 0.3,
      fadeOut: 1,
    },

    glassBell: {
      label: "Glass Bell",
      icon: "🔮",
      bass: 1,
      speed: 1.2,
      fadeIn: 1.2,
      fadeOut: 1.2,
    },

    shortBuzz: {
      label: "Short Buzz",
      icon: "🐝",
      bass: 5,
      speed: 1.4,
      fadeIn: 0,
      fadeOut: 0,
    },

    cinematicPing: {
      label: "Cinematic Ping",
      icon: "🎬",
      bass: 6,
      speed: 1.05,
      fadeIn: 0.8,
      fadeOut: 1.2,
    },

    sharpClick: {
      label: "Sharp Click",
      icon: "🖱️",
      bass: 3,
      speed: 1.25,
      fadeIn: 0,
      fadeOut: 0.1,
    },

    androidLikeDefault: {
      label: "Android Default",
      icon: "📱",
      bass: 4,
      speed: 1,
      fadeIn: 0.2,
      fadeOut: 0.4,
    },

    premiumTone: {
      label: "Premium Tone",
      icon: "💠",
      bass: 7,
      speed: 1,
      fadeIn: 1,
      fadeOut: 1,
    },
  };

  const processAudio =
    async () => {
      if (!file) return;

      try {
        setLoading(true);

        const blob =
          await trimAudio(
            file,
            form.start,
            form.end,
            form.fadeIn,
            form.fadeOut,
            form.bass,
            form.treble,
            form.speed
          );

        if (outputUrl) {
          URL.revokeObjectURL(
            outputUrl
          );
        }

        const url =
          URL.createObjectURL(
            blob
          );

        setOutputUrl(url);
      } catch (err) {
        console.error(err);

        alert(
          err.message ||
          "Audio processing failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-purple-950 text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-fuchsia-600/20 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">

          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            TonEva
          </h1>

          <p className="text-slate-400 my-4">
            Make your ringtone in seconds!
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-5">
            <span className="text-sm text-slate-300">
              made with ❤️ by <a className="font-bold" href="https://www.linkedin.com/in/mudassarsindoli/" target="_blank">mudassar.sindoli</a>
            </span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8">
          <AudioUploader
            onUpload={(f) => {
              setFile(f);

              const url =
                URL.createObjectURL(
                  f
                );

              setAudioUrl(url);

              const audio =
                document.createElement(
                  "audio"
                );

              audio.src = url;

              audio.onloadedmetadata =
                () => {
                  setDuration(
                    audio.duration
                  );

                  setForm(
                    (prev) => ({
                      ...prev,
                      end: Math.min(
                        30,
                        audio.duration
                      ),
                    })
                  );
                };
            }}
          />

          {audioUrl && (
            <>
              <div className="mt-8 bg-black/30 border border-white/10 rounded-3xl p-6">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() =>
                    setIsPlaying(
                      false
                    )
                  }
                />

                <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Live Preview
                    </h2>

                    <p className="text-slate-400">
                      Hear changes
                      instantly
                    </p>
                  </div>

                  <button
                    onClick={
                      togglePlay
                    }
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-2xl flex items-center justify-center hover:scale-110 transition"
                  >
                    {isPlaying
                      ? "⏸"
                      : "▶"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm text-slate-400 mt-3">
                <span>
                  {formatTime(currentTime)}
                </span>

                <span>
                  {formatTime(form.end)}
                </span>
              </div>

              <div className="mt-6 bg-black/20 border border-white/10 rounded-3xl p-6">
                <div className="flex justify-between mb-4">
                  <span>
                    Start
                  </span>

                  <span>
                    {formatTime(
                      form.start
                    )}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={form.start}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start:
                        Number(
                          e.target
                            .value
                        ),
                    })
                  }
                  className="w-full accent-fuchsia-500"
                />

                <div className="flex justify-between mt-6 mb-4">
                  <span>
                    End
                  </span>

                  <span>
                    {formatTime(
                      form.end
                    )}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={form.end}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end: Number(
                        e.target
                          .value
                      ),
                    })
                  }
                  className="w-full accent-cyan-500"
                />

                <div className="mt-4 text-center text-slate-400">
                  Duration:{" "}
                  {Math.max(
                    0,
                    form.end -
                    form.start
                  ).toFixed(1)}
                  s
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-6">
                <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-3xl p-5">
                  <div className="flex justify-between mb-4">
                    <span>
                      🎸 Bass
                    </span>

                    <span>
                      {
                        form.bass
                      }{" "}
                      dB
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={
                      form.bass
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bass: Number(
                          e.target
                            .value
                        ),
                      })
                    }
                    className="w-full accent-fuchsia-500"
                  />
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-5">
                  <div className="flex justify-between mb-4">
                    <span>
                      ⚡ Speed
                    </span>

                    <span>
                      {
                        form.speed
                      }
                      x
                    </span>
                  </div>

                  <select
                    value={
                      form.speed
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        speed:
                          Number(
                            e.target
                              .value
                          ),
                      })
                    }
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3"
                  >
                    <option className="bg-black border-0" value="0.75">
                      0.75x
                    </option>
                    <option className="bg-black border-0" value="1">
                      1x
                    </option>
                    <option className="bg-black border-0" value="1.25">
                      1.25x
                    </option>
                    <option className="bg-black border-0" value="1.5">
                      1.5x
                    </option>
                    <option className="bg-black border-0" value="1.75">
                      1.75x
                    </option>
                    <option className="bg-black border-0" value="2">
                      2x
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-5">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <div className="flex justify-between mb-3">
                    <span>
                      Fade In
                    </span>

                    <span>
                      {
                        form.fadeIn
                      }
                      s
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={
                      form.fadeIn
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fadeIn:
                          Number(
                            e.target
                              .value
                          ),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <div className="flex justify-between mb-3">
                    <span>
                      Fade Out
                    </span>

                    <span>
                      {
                        form.fadeOut
                      }
                      s
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={
                      form.fadeOut
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fadeOut:
                          Number(
                            e.target
                              .value
                          ),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-slate-300">
                  Quick Presets
                </h3>

                <div className="flex flex-wrap gap-3">
                  {Object.entries(ringtonePresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setForm({
                          ...form,
                          ...preset,
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
                    >
                      {preset.icon} {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={
                  processAudio
                }
                disabled={
                  loading
                }
                className="cursor-pointer mt-8 w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-fuchsia-600 via-pink-600 to-cyan-600 hover:scale-[1.01] transition"
              >
                {loading
                  ? "Processing..."
                  : "Generate"}
              </button>

              {outputUrl && (
                <a
                  href={
                    outputUrl
                  }
                  download="ms_ringtone.mp3"
                  className="mt-4 block text-center w-full py-4 rounded-2xl font-bold bg-green-600 hover:bg-green-500 transition"
                >
                  ⬇ Download My Ringtone
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;