import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

export async function trimAudio(
  file,
  {
    start,
    end,
    fadeIn = 0,
    fadeOut = 0,
    bass = 0,
    treble = 0,
    speed = 1,
    pitch = 1,
    volume = 1,
    echo = false,
    normalize = false,
  }
) {
  if (!ffmpeg.loaded) {
    await ffmpeg.load();
  }

  const startSec = Number(start);
  const endSec = Number(end);

  const fadeInSec = Number(fadeIn);
  const fadeOutSec = Number(fadeOut);

  const bassDb = Number(bass);
  const trebleDb = Number(treble);
  const volumeGain = Number(volume);

  const pitchRate = Math.max(
    0.5,
    Math.min(2, Number(pitch))
  );

  const speedRate = Math.max(
    0.5,
    Math.min(2, Number(speed))
  );

  const duration = endSec - startSec;

  if (duration <= 0) {
    throw new Error(
      "End time must be greater than start time"
    );
  }

  try {
    await ffmpeg.deleteFile("input.mp3");
  } catch {}

  try {
    await ffmpeg.deleteFile("output.mp3");
  } catch {}

  await ffmpeg.writeFile(
    "input.mp3",
    await fetchFile(file)
  );

  const filters = [];

// Trim inside filtergraph
filters.push(
  `atrim=start=${startSec}:end=${endSec},asetpts=PTS-STARTPTS`
);

// Bass
if (bassDb !== 0) {
  filters.push(`bass=g=${bassDb}`);
}

// Treble
if (trebleDb !== 0) {
  filters.push(`treble=g=${trebleDb}`);
}

// Volume
if (volumeGain !== 1) {
  filters.push(`volume=${volumeGain}`);
}

// Pitch (shift pitch, then compensate tempo back to normal)
if (pitchRate !== 1) {
  filters.push(`asetrate=44100*${pitchRate}`);
  filters.push(`aresample=44100`);
  filters.push(`atempo=${(1 / pitchRate).toFixed(4)}`);
}

// Speed
if (speedRate !== 1) {
  filters.push(`atempo=${speedRate}`);
}

// Echo
if (echo) {
  filters.push(`aecho=0.6:0.5:500:0.4`);
}

// Loudness normalization
if (normalize) {
  filters.push(`dynaudnorm=f=150:g=15`);
}

// Fade In
if (fadeInSec > 0) {
  const safeFadeIn = Math.min(fadeInSec, duration / 2);
  filters.push(`afade=t=in:st=0:d=${safeFadeIn}`);
}

// Fade Out
if (fadeOutSec > 0) {
  const safeFadeOut = Math.min(fadeOutSec, duration / 2);

  const effectiveDuration =
    duration / speedRate; // important when speed changes

  const fadeOutStart =
    effectiveDuration - safeFadeOut;

  filters.push(
    `afade=t=out:st=${fadeOutStart}:d=${safeFadeOut}`
  );
}

  const command = [
    "-i",
    "input.mp3",
    "-af",
    filters.join(","),
    "output.mp3",
  ];

  console.log(
    "FFmpeg Command:",
    command
  );

  await ffmpeg.exec(command);

  const data =
    await ffmpeg.readFile("output.mp3");

  console.log(
    "Output Size:",
    data.length
  );

  return new Blob([data], {
    type: "audio/mpeg",
  });
}