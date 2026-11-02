"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/States";
import { formatDuration } from "@/lib/youtube/parse";
import { cn } from "@/lib/utils/cn";

type AudioPlayerProps = {
  src: string;
  title: string;
  /** Optional, for future use (e.g. a download hint); the browser sniffs the format. */
  mimeType?: string;
  className?: string;
};

/** Only one sermon plays at a time: starting one pauses any other. */
let playing: HTMLAudioElement | null = null;

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

const time = (seconds: number) => (Number.isFinite(seconds) ? formatDuration(Math.floor(seconds)) || "0:00" : "0:00");

/**
 * Accessible sermon audio player built on the native <audio> element.
 * Never autoplays. Keyboard: Tab to each control; the seek bar responds to
 * arrow keys (5 s) and Page Up/Down. Shows loading and error states.
 */
export function AudioPlayer({ src, title, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const id = useId();
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // The browser may load the metadata (or fail) before React is listening —
    // sync once after mount so duration and error states are never missed.
    const frame = requestAnimationFrame(() => {
      // error set, or NETWORK_NO_SOURCE (3): the file could not be loaded.
      if (audio.error || audio.networkState === 3) setStatus("error");
      else if (audio.readyState >= 1) {
        setDuration(audio.duration);
        setStatus((s) => (s === "idle" ? "ready" : s));
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      if (playing === audio) playing = null;
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || status === "error") return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (playing && playing !== audio) playing.pause();
    playing = audio;
    try {
      setStatus((s) => (s === "ready" ? s : "loading"));
      await audio.play();
    } catch {
      setStatus("error");
    }
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(value)) {
      audio.currentTime = value;
      setCurrent(value);
    }
  };

  return (
    <div
      className={cn("squircle rounded-card bg-white p-5 text-plum-950 shadow-card md:p-6", className)}
      role="group"
      aria-label={`Audio player: ${title}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setStatus((s) => (s === "error" ? s : "ready"));
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setStatus("loading")}
        onPlaying={() => setStatus("ready")}
        onError={() => {
          setStatus("error");
          setIsPlaying(false);
        }}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={status === "error"}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="squircle grid size-14 shrink-0 place-items-center rounded-full bg-plum-600 text-white transition-[background-color,scale] hover:bg-plum-700 active:scale-95 disabled:opacity-40"
        >
          {status === "loading" && isPlaying ? (
            <Spinner className="size-6" />
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
              <path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
            </svg>
          ) : (
            <Icon name="play" size={24} className="translate-x-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <label htmlFor={`${id}-seek`} className="sr-only">
            Seek
          </label>
          <input
            id={`${id}-seek`}
            type="range"
            min={0}
            max={duration || 0}
            step={5}
            value={Math.min(current, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={!duration || status === "error"}
            aria-valuetext={`${time(current)} of ${duration ? time(duration) : "unknown length"}`}
            className="mt-2 w-full cursor-pointer accent-plum-600 disabled:cursor-not-allowed"
          />
          <div className="mt-1 flex justify-between text-xs text-plum-950/60 tabular-nums">
            <span>{time(current)}</span>
            <span>{duration ? time(duration) : "--:--"}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-plum-100 pt-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-plum-950/60">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const value = Number(e.target.value);
              setVolume(value);
              if (audioRef.current) audioRef.current.volume = value;
            }}
            className="w-24 cursor-pointer accent-plum-600"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-plum-950/60">Speed</span>
          <select
            value={rate}
            onChange={(e) => {
              const value = Number(e.target.value);
              setRate(value);
              if (audioRef.current) audioRef.current.playbackRate = value;
            }}
            className="rounded-lg border border-plum-200 bg-white px-2 py-1"
          >
            {SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}×
              </option>
            ))}
          </select>
        </label>
        <a
          href={src}
          download
          className="ml-auto inline-flex min-h-11 items-center gap-1.5 font-semibold text-plum-600 hover:underline"
        >
          Download <Icon name="arrowUpRight" size={14} />
        </a>
      </div>

      <p role="status" aria-live="polite" className={cn("text-sm", status === "error" ? "mt-3 text-plum-700" : "sr-only")}>
        {status === "error"
          ? "Sorry — this recording couldn’t be loaded. Please try again later."
          : isPlaying
            ? "Playing"
            : "Paused"}
      </p>
    </div>
  );
}
