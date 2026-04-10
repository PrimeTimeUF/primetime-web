"use client";

import { useState } from "react";
import { Modal } from "@/components";
import { BrutalistButton, themeTokens } from "@/components/ui/dashboard-primitives";
import type { PrimingSessionListItem } from "@/lib/types/priming-session";

interface AssignSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  sessions: PrimingSessionListItem[];
  assignedSessionIds: Set<string>;
  onAssigned: () => void;
  isDark?: boolean;
}

export default function AssignSessionModal({
  open,
  onOpenChange,
  courseId,
  sessions,
  assignedSessionIds,
  onAssigned,
  isDark = true,
}: Readonly<AssignSessionModalProps>) {
  const t = themeTokens(isDark);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Only show completed sessions that haven't been assigned yet
  const availableSessions = sessions.filter(
    (s) => s.status === "completed" && !assignedSessionIds.has(s.id)
  );

  const handleSubmit = async () => {
    if (!selectedSessionId) {
      setError("Please select a session");
      return;
    }
    if (!dueDate) {
      setError("Please select a due date");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: selectedSessionId,
          due_date: dueDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign session");
      }

      onOpenChange(false);
      setSelectedSessionId("");
      setDueDate("");
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedSessionId("");
    setDueDate("");
    setError("");
  };

  // Get tomorrow's date as the minimum due date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <Modal.Content size="md" isDark={isDark}>
        <Modal.Title>Assign Session to Students</Modal.Title>
        <Modal.Description>
          Select a completed priming session and set a due date for your
          students.
        </Modal.Description>

        <div className="mt-6 space-y-6">
          {/* Session selector */}
          <div>
            <label className={`mb-2 block font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>
              Priming Session
            </label>
            {availableSessions.length === 0 ? (
              <p className={`font-mono text-xs ${t.textMid}`}>
                No unassigned completed sessions available. Create and complete
                a priming session first.
              </p>
            ) : (
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-sm px-4 py-3 focus:outline-none focus:border-current transition-colors duration-200`}
                disabled={isLoading}
              >
                <option value="" className={isDark ? "bg-black" : "bg-white"}>Select a session...</option>
                {availableSessions.map((session) => (
                  <option key={session.id} value={session.id} className={isDark ? "bg-black" : "bg-white"}>
                    {session.title || session.lecture_name || "Untitled session"}
                    {session.duration ? ` (${session.duration} min)` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Due date picker */}
          <div>
            <label className={`mb-2 block font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={minDate}
              className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-sm px-4 py-3 focus:outline-none focus:border-current transition-colors duration-200`}
              disabled={isLoading}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className={`font-mono text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
          )}
        </div>

        <Modal.Footer>
          <Modal.Close>
            <BrutalistButton isDark={isDark} variant="secondary" disabled={isLoading} className="w-full sm:w-auto">
              Cancel
            </BrutalistButton>
          </Modal.Close>
          <BrutalistButton
            isDark={isDark}
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !selectedSessionId ||
              !dueDate ||
              availableSessions.length === 0
            }
            className="w-full sm:w-auto"
          >
            {isLoading ? "ASSIGNING..." : "ASSIGN SESSION"}
          </BrutalistButton>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
