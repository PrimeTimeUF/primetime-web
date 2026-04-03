"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components";
import { BrutalistButton, themeTokens } from "@/components/ui/dashboard-primitives";

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onCreated: () => void;
  isDark?: boolean;
}

interface DurationOption {
  value: 10 | 15 | 30;
  label: string;
  description: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  {
    value: 10,
    label: "10 min",
    description: "Quick overview with key terms and 3 questions",
  },
  {
    value: 15,
    label: "15 min",
    description: "Balanced session with concepts and 4 questions",
  },
  {
    value: 30,
    label: "30 min",
    description: "In-depth coverage with detailed concepts and 6 questions",
  },
];

export default function CreateSessionModal({
  open,
  onOpenChange,
  courseId,
  onCreated,
  isDark = true,
}: Readonly<CreateSessionModalProps>) {
  const t = themeTokens(isDark);
  const [lectureNames, setLectureNames] = useState<string[]>([]);
  const [selectedLecture, setSelectedLecture] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<10 | 15 | 30>(15);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  const fetchLectureNames = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (res.ok) {
        const data = await res.json();
        const names = Array.from(
          new Set(
            (data.materials || [])
              .map((m: { lecture_name: string | null }) => m.lecture_name)
              .filter((name: string | null): name is string => name !== null)
          )
        ) as string[];
        setLectureNames(names);
        if (names.length > 0 && !selectedLecture) {
          setSelectedLecture(names[0]);
        }
      }
    } catch {
      console.error("Failed to fetch lecture names");
    } finally {
      setIsFetching(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (open) {
      fetchLectureNames();
      setError("");
    }
  }, [open, fetchLectureNames]);

  const handleSubmit = async () => {
    if (!selectedLecture) {
      setError("Please select a lecture group");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/courses/${courseId}/sessions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureName: selectedLecture,
          duration: selectedDuration,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
      }

      onOpenChange(false);
      setSelectedLecture("");
      setSelectedDuration(15);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md" isDark={isDark}>
        <Modal.Title>Create Priming Session</Modal.Title>
        <Modal.Description>
          Select a lecture group and session duration to generate a priming
          session for your students.
        </Modal.Description>

        <div className="mt-6 space-y-6">
          {/* Lecture group selector */}
          <div>
            <label className={`mb-2 block font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>
              Lecture Group
            </label>
            {isFetching ? (
              <p className={`font-mono text-xs ${t.textMid}`}>Loading lectures...</p>
            ) : lectureNames.length === 0 ? (
              <p className={`font-mono text-xs ${t.textMid}`}>
                No lecture groups found. Upload PDF materials with a lecture name
                first.
              </p>
            ) : (
              <select
                value={selectedLecture}
                onChange={(e) => setSelectedLecture(e.target.value)}
                className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-sm px-4 py-3 focus:outline-none focus:border-current transition-colors duration-200`}
                disabled={isLoading}
              >
                <option value="" className={isDark ? "bg-black" : "bg-white"}>Select a lecture...</option>
                {lectureNames.map((name) => (
                  <option key={name} value={name} className={isDark ? "bg-black" : "bg-white"}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Duration selector */}
          <div>
            <label className={`mb-2 block font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>
              Session Duration
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedDuration(option.value)}
                  disabled={isLoading}
                  className={`border-2 p-3 text-left transition-colors duration-200 ${
                    selectedDuration === option.value
                      ? `${t.borderFull} ${t.cardBg}`
                      : `${t.border} ${isDark ? "hover:border-white/30" : "hover:border-black/25"}`
                  }`}
                >
                  <p className={`font-mono text-sm font-bold tracking-wider ${t.text}`}>
                    {option.label}
                  </p>
                  <p className={`mt-1 font-mono text-[10px] leading-snug ${t.textMid}`}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className={`font-mono text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
          )}
        </div>

        <Modal.Footer>
          <Modal.Close>
            <BrutalistButton isDark={isDark} variant="secondary" disabled={isLoading}>
              Cancel
            </BrutalistButton>
          </Modal.Close>
          <BrutalistButton
            isDark={isDark}
            onClick={handleSubmit}
            disabled={isLoading || !selectedLecture || lectureNames.length === 0}
          >
            {isLoading ? "CREATING..." : "CREATE SESSION"}
          </BrutalistButton>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
