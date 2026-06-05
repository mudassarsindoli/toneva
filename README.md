# 🎵 MP3 Trimmer – Browser-Based Audio Editor

A modern, in-browser audio editing tool that lets you **trim MP3 files, apply effects, preview changes in real-time, and export high-quality audio** — all without installing any software.

Built with **React + Tailwind CSS + FFmpeg.wasm + Web Audio API**.

---

## 🚀 Features

### 🎧 Core Audio Editing
- Trim audio (start & end selection)
- Fade In / Fade Out effects
- Playback speed control (0.75x → 2x)
- Bass boost (live preview via Web Audio API)
- Treble support (FFmpeg processing ready)

### 🎙 Live Preview Engine
- Instant audio preview without exporting
- Play / Pause control
- Spacebar shortcut support
- Real-time speed & bass adjustments
- Trim-range playback loop

### ⚡ Smart UX
- Drag-friendly timeline sliders
- Duration display in mm:ss format
- Quick presets (Podcast / Reel / Bass Boost)
- Responsive glassmorphism UI
- Instant download after processing

### 📁 Input Support
- Upload local MP3 files
- (Optional) URL input support for media import

---

## 🧠 How It Works

### 1. Upload
User uploads an MP3 file or provides a media URL.

### 2. Preview
Audio is played in-browser using:
- HTML Audio API
- Web Audio API (for bass boost + effects)

### 3. Edit
User adjusts:
- Start / End time
- Bass / Treble
- Fade In / Fade Out
- Speed

### 4. Process
FFmpeg.wasm processes audio in-browser:

### 5. Export
Final processed audio is downloaded as MP3.

---

## 🧱 Tech Stack

- ⚛️ React (Frontend)
- 🎨 Tailwind CSS (UI)
- 🎧 Web Audio API (Live preview effects)
- 🎬 FFmpeg.wasm (Audio processing engine)
- 🧠 JavaScript (Core logic)

---

## 📦 Installation

```bash
git clone https://github.com/mudassarsindoli/mp3-trimmer
cd mp3-trimmer
npm install
npm run dev