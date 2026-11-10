import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Music2,
  Gauge,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Download,
  Clock,
  Volume2,
  Zap,
  Waves,
  Repeat2,
  Activity,
} from "lucide-react";
import AudioUploader from "./components/AudioUploader";
import DualRangeSlider from "./components/DualRangeSlider";
import SingleRangeSlider from "./components/SingleRangeSlider";
import SelectGroup from "./components/SelectGroup";
import { trimAudio } from "./utils/ffmpegService";

const BASS_OPTIONS = [
  { label: "Low", value: 2 },
  { label: "Medium", value: 6 },
  { label: "High", value: 10 },
];

const FADE_OPTIONS = [
  { label: "None", value: 0 },
  { label: "Short", value: 1 },
  { label: "Long", value: 3 },
];

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2].map((v) => ({
  label: `${v}x`,
  value: v,
}));

const TREBLE_OPTIONS = [
  { label: "Low", value: 2 },
  { label: "Medium", value: 6 },
  { label: "High", value: 10 },
];

const VOLUME_OPTIONS = [
  { label: "Normal", value: 1 },
  { label: "Loud", value: 1.5 },
  { label: "Max", value: 2 },
];

const PITCH_OPTIONS = [
  { label: "Deeper", value: 0.7 },
  { label: "Deep", value: 0.85 },
  { label: "Normal", value: 1 },
  { label: "High", value: 1.2 },
  { label: "Higher", value: 1.4 },
];

const TOGGLE_OPTIONS = [
  { label: "Off", value: false },
  { label: "On", value: true },
];

function App() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [duration, setDuration] = useState(300);

  const [form, setForm] = useState({
    start: 0,
    end: 30,
    fadeIn: 1,
    fadeOut: 1,
    bass: 6,
    treble: 6,
    speed: 1,
    pitch: 1,
    volume: 1,
    echo: false,
    normalize: false,
  });

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const bassFilterRef = useRef(null);
  const trebleFilterRef = useRef(null);
  const volumeGainRef = useRef(null);
  const compressorRef = useRef(null);
  const echoWetRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeUnit, setTimeUnit] = useState("sec");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatPrecise = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0",
    )}.${String(ms).padStart(3, "0")}`;
  };

  const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    const initialize = async () => {
      if (audioContextRef.current) return;

      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);

      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 200;

      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 3000;

      const volumeGain = ctx.createGain();
      volumeGain.gain.value = 1;

      const compressor = ctx.createDynamicsCompressor();

      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.35;

      const feedback = ctx.createGain();
      feedback.gain.value = 0.3;

      const echoWet = ctx.createGain();
      echoWet.gain.value = 0;

      // Dry signal path
      source.connect(bass);
      bass.connect(treble);
      treble.connect(volumeGain);
      volumeGain.connect(compressor);
      compressor.connect(ctx.destination);

      // Echo send
      compressor.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(echoWet);
      echoWet.connect(ctx.destination);

      audioContextRef.current = ctx;
      sourceRef.current = source;
      bassFilterRef.current = bass;
      trebleFilterRef.current = treble;
      volumeGainRef.current = volumeGain;
      compressorRef.current = compressor;
      echoWetRef.current = echoWet;
    };

    initialize();

    const updateTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("timeupdate", updateTime);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    // Speed + Pitch Preview (pitch approximated by also shifting rate)
    audio.preservesPitch = form.pitch === 1;
    audio.playbackRate = form.speed * form.pitch;

    // Bass Preview
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = form.bass;
    }

    // Treble Preview
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = form.treble;
    }

    // Loudness Preview
    if (volumeGainRef.current) {
      volumeGainRef.current.gain.value = form.volume;
    }

    // Normalize Preview (approximated with dynamics compression)
    if (compressorRef.current) {
      const compressor = compressorRef.current;

      if (form.normalize) {
        compressor.threshold.value = -24;
        compressor.knee.value = 10;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
      } else {
        compressor.threshold.value = 0;
        compressor.ratio.value = 1;
      }
    }

    // Echo Preview
    if (echoWetRef.current) {
      echoWetRef.current.gain.value = form.echo ? 0.35 : 0;
    }

    // Keep playback inside selected trim range
    if (audio.currentTime < form.start || audio.currentTime > form.end) {
      audio.currentTime = form.start;
    }

    const handleTimeUpdate = () => {
      // Stop at trim end
      if (audio.currentTime >= form.end) {
        audio.pause();
        audio.currentTime = form.start;
        setIsPlaying(false);
      }

      // Fade In Preview
      if (
        form.fadeIn > 0 &&
        audio.currentTime >= form.start &&
        audio.currentTime <= form.start + form.fadeIn
      ) {
        const progress = (audio.currentTime - form.start) / form.fadeIn;
        audio.volume = Math.min(1, Math.max(0, progress));
      }

      // Fade Out Preview
      else if (
        form.fadeOut > 0 &&
        audio.currentTime >= form.end - form.fadeOut
      ) {
        const progress = (form.end - audio.currentTime) / form.fadeOut;
        audio.volume = Math.min(1, Math.max(0, progress));
      } else {
        audio.volume = 1;
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.volume = 0.4;
    };
  }, [
    form.start,
    form.end,
    form.bass,
    form.treble,
    form.volume,
    form.speed,
    form.pitch,
    form.echo,
    form.normalize,
    form.fadeIn,
    form.fadeOut,
  ]);

  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (audio.paused) {
      audio.currentTime = form.start;
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const processAudio = async () => {
    if (!file) return;

    try {
      setLoading(true);

      const blob = await trimAudio(file, form);

      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }

      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
    } catch (err) {
      console.error(err);
      alert(err.message || "Audio processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-white overflow-hidden">
      {/* macOS-style title bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>

        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
          <img
            src="/logo.svg"
            alt="TonEva"
            className="w-5 h-5 rounded-md shadow-sm"
          />
          TonEva
        </div>

        <button
          onClick={togglePlay}
          disabled={!audioUrl}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white flex items-center justify-center shadow-md disabled:opacity-30 hover:scale-105 active:scale-95 transition"
          aria-label="Live preview"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      <div className="flex-1 w-full overflow-y-auto bg-gradient-to-br from-violet-200 via-sky-100 to-rose-100 flex items-start justify-center p-3 sm:p-4 md:p-8">
        <div className="w-full max-w-3xl flex flex-col justify-center gap-5">
          {!audioUrl && (
            <AudioUploader
              onUpload={(f) => {
                setFile(f);

                const url = URL.createObjectURL(f);
                setAudioUrl(url);

                const audio = document.createElement("audio");
                audio.src = url;

                audio.onloadedmetadata = () => {
                  setDuration(audio.duration);

                  setForm((prev) => ({
                    ...prev,
                    end: Math.min(30, audio.duration),
                  }));
                };
              }}
            />
          )}

          {audioUrl && (
            <div className="flex flex-col gap-5">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="truncate pr-2 font-medium text-gray-700">
                  🎧 {file?.name}
                </span>

                <span className="flex items-center gap-1 text-gray-400">
                  <Clock size={14} />
                  {formatTime(currentTime)}
                </span>
              </div>

              <div className="bg-gradient-to-br from-fuchsia-50 to-cyan-50 border border-fuchsia-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Trim Range
                  </p>

                  <div className="flex gap-1 bg-white rounded-lg p-0.5 shadow-sm border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setTimeUnit("sec")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        timeUnit === "sec"
                          ? "bg-gray-900 text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Sec
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimeUnit("ms")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        timeUnit === "ms"
                          ? "bg-gray-900 text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      MilliSec
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-fuchsia-600 font-semibold">
                      Start {timeUnit === "ms" ? "(ms)" : "(s)"}
                    </span>

                    <input
                      type="number"
                      step={timeUnit === "ms" ? 1 : 0.01}
                      min={0}
                      max={timeUnit === "ms" ? duration * 1000 : duration}
                      value={
                        timeUnit === "ms"
                          ? Math.round(form.start * 1000)
                          : Number(form.start.toFixed(2))
                      }
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const seconds = timeUnit === "ms" ? raw / 1000 : raw;

                        setForm({
                          ...form,
                          start: clamp(seconds, 0, form.end - 0.01),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-cyan-600 font-semibold">
                      End {timeUnit === "ms" ? "(ms)" : "(s)"}
                    </span>

                    <input
                      type="number"
                      step={timeUnit === "ms" ? 1 : 0.01}
                      min={0}
                      max={timeUnit === "ms" ? duration * 1000 : duration}
                      value={
                        timeUnit === "ms"
                          ? Math.round(form.end * 1000)
                          : Number(form.end.toFixed(2))
                      }
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const seconds = timeUnit === "ms" ? raw / 1000 : raw;

                        setForm({
                          ...form,
                          end: clamp(seconds, form.start + 0.01, duration),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </label>
                </div>

                {timeUnit === "sec" && (
                  <DualRangeSlider
                    min={0}
                    max={duration}
                    start={form.start}
                    end={form.end}
                    format={formatTime}
                    onChange={(start, end) => setForm({ ...form, start, end })}
                  />
                )}

                {timeUnit === "ms" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-center text-[11px] text-fuchsia-600 font-semibold mb-1">
                        Start · {Math.floor(form.start)}s window
                      </p>

                      <SingleRangeSlider
                        min={Math.floor(form.start)}
                        max={Math.min(duration, Math.floor(form.start) + 1)}
                        value={form.start}
                        format={formatPrecise}
                        thumbClass="border-fuchsia-500"
                        fillClass="bg-fuchsia-500"
                        onChange={(start) =>
                          setForm({
                            ...form,
                            start: clamp(
                              start,
                              Math.floor(form.start),
                              Math.min(
                                form.end - 0.001,
                                Math.floor(form.start) + 1,
                              ),
                            ),
                          })
                        }
                      />
                    </div>

                    <div>
                      <p className="text-center text-[11px] text-cyan-600 font-semibold mb-1">
                        End · {Math.floor(form.end)}s window
                      </p>

                      <SingleRangeSlider
                        min={Math.floor(form.end)}
                        max={Math.min(duration, Math.floor(form.end) + 1)}
                        value={form.end}
                        format={formatPrecise}
                        thumbClass="border-cyan-500"
                        fillClass="bg-cyan-500"
                        onChange={(end) =>
                          setForm({
                            ...form,
                            end: clamp(
                              end,
                              Math.max(
                                form.start + 0.001,
                                Math.floor(form.end),
                              ),
                              Math.min(duration, Math.floor(form.end) + 1),
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <p className="text-center text-xs text-gray-500 mt-1 font-medium">
                  Duration:{" "}
                  {Math.max(0, form.end - form.start).toFixed(
                    timeUnit === "ms" ? 3 : 1,
                  )}
                  s
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectGroup
                  label="Bass"
                  icon={<Music2 size={13} className="text-violet-500" />}
                  value={form.bass}
                  options={BASS_OPTIONS}
                  activeClass="bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                  onChange={(bass) => setForm({ ...form, bass })}
                />

                <SelectGroup
                  label="Speed"
                  icon={<Gauge size={13} className="text-blue-500" />}
                  value={form.speed}
                  options={SPEED_OPTIONS}
                  activeClass="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  onChange={(speed) => setForm({ ...form, speed })}
                />

                <SelectGroup
                  label="Fade In"
                  icon={<TrendingUp size={13} className="text-emerald-500" />}
                  value={form.fadeIn}
                  options={FADE_OPTIONS}
                  activeClass="bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                  onChange={(fadeIn) => setForm({ ...form, fadeIn })}
                />

                <SelectGroup
                  label="Fade Out"
                  icon={<TrendingDown size={13} className="text-amber-500" />}
                  value={form.fadeOut}
                  options={FADE_OPTIONS}
                  activeClass="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  onChange={(fadeOut) => setForm({ ...form, fadeOut })}
                />

                <SelectGroup
                  label="Treble"
                  icon={<Volume2 size={13} className="text-rose-500" />}
                  value={form.treble}
                  options={TREBLE_OPTIONS}
                  activeClass="bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                  onChange={(treble) => setForm({ ...form, treble })}
                />

                <SelectGroup
                  label="Loudness"
                  icon={<Zap size={13} className="text-yellow-500" />}
                  value={form.volume}
                  options={VOLUME_OPTIONS}
                  activeClass="bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                  onChange={(volume) => setForm({ ...form, volume })}
                />

                <SelectGroup
                  label="Pitch"
                  icon={<Waves size={13} className="text-teal-500" />}
                  value={form.pitch}
                  options={PITCH_OPTIONS}
                  activeClass="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                  onChange={(pitch) => setForm({ ...form, pitch })}
                />

                <SelectGroup
                  label="Echo"
                  icon={<Repeat2 size={13} className="text-indigo-500" />}
                  value={form.echo}
                  options={TOGGLE_OPTIONS}
                  activeClass="bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                  onChange={(echo) => setForm({ ...form, echo })}
                />

                <SelectGroup
                  label="Normalize"
                  icon={<Activity size={13} className="text-lime-500" />}
                  value={form.normalize}
                  options={TOGGLE_OPTIONS}
                  activeClass="bg-gradient-to-r from-lime-500 to-green-500 text-white"
                  onChange={(normalize) => setForm({ ...form, normalize })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={processAudio}
                  disabled={loading}
                  className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-fuchsia-600 via-pink-600 to-cyan-600 hover:scale-[1.01] disabled:opacity-50 transition shadow-md"
                >
                  <Sparkles size={18} />
                  {loading ? "Processing..." : "Generate"}
                </button>

                {outputUrl && (
                  <a
                    href={outputUrl}
                    download="toneva_ringtone.mp3"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.01] transition shadow-md"
                  >
                    <Download size={18} />
                    Download
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
