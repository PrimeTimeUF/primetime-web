"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AudioPlayerProps {
  src: string;
  isDark?: boolean;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, isDark = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [isLoading, setIsLoading] = useState(true);
  const progressRef = useRef<HTMLDivElement>(null);

  // Theme colors
  const bg = isDark ? 'bg-black/40' : 'bg-gray-50';
  const border = isDark ? 'border-white/15' : 'border-gray-200';
  const text = isDark ? 'text-white' : 'text-black';
  const textMid = isDark ? 'text-white/60' : 'text-gray-500';
  const textDim = isDark ? 'text-white/40' : 'text-gray-400';
  const progressBg = isDark ? 'bg-white/20' : 'bg-gray-200';
  const progressFill = isDark ? 'bg-white' : 'bg-black';
  const buttonBg = isDark ? 'bg-white' : 'bg-black';
  const buttonText = isDark ? 'text-black' : 'text-white';
  const buttonHover = isDark ? 'hover:bg-white/90' : 'hover:bg-gray-800';
  const speedBtn = isDark ? 'border-white/20 bg-transparent text-white/60 hover:border-white/40' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400';
  const speedBtnActive = isDark ? 'bg-white text-black' : 'bg-black text-white';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await audio.play();
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`border ${border} ${bg} p-5`}>
      <p className={`mb-3 font-mono text-xs font-semibold uppercase tracking-widest ${textMid}`}>
        Listen Instead
      </p>

      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Play / Pause button */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`flex w-full items-center justify-center gap-3 ${buttonBg} px-4 py-3 font-mono text-sm font-medium ${buttonText} transition-colors ${buttonHover} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isPlaying ? (
          <>
            <PauseIcon />
            Pause
          </>
        ) : (
          <>
            <PlayIcon />
            {isLoading ? "Loading audio..." : "Play Audio Version"}
          </>
        )}
      </button>

      {/* Progress bar */}
      <div className="mt-4">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className={`relative h-1.5 cursor-pointer overflow-hidden rounded-full ${progressBg}`}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${progressFill} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time display */}
        <div className={`mt-1.5 flex justify-between font-mono text-xs ${textDim}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Speed controls */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`font-mono text-xs ${textDim}`}>Speed:</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`font-mono px-2.5 py-1 text-xs font-medium transition-colors ${
                speed === s
                  ? speedBtnActive
                  : `border ${speedBtn}`
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
