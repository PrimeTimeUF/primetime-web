"use client";

import { useState } from "react";
import { Button, Modal } from "@/components";
import type { PrimingSessionListItem } from "@/lib/types/priming-session";

interface AssignSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  sessions: PrimingSessionListItem[];
  assignedSessionIds: Set<string>;
  onAssigned: () => void;
}

export default function AssignSessionModal({
  open,
  onOpenChange,
  courseId,
  sessions,
  assignedSessionIds,
  onAssigned,
}: Readonly<AssignSessionModalProps>) {
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
      <Modal.Content size="md">
        <Modal.Title>Assign Session to Students</Modal.Title>
        <Modal.Description>
          Select a completed priming session and set a due date for your
          students.
        </Modal.Description>

        <div className="mt-6 space-y-6">
          {/* Session selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Priming Session
            </label>
            {availableSessions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No unassigned completed sessions available. Create and complete
                a priming session first.
              </p>
            ) : (
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                disabled={isLoading}
              >
                <option value="">Select a session...</option>
                {availableSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title || session.lecture_name || "Untitled session"}
                    {session.duration ? ` (${session.duration} min)` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Due date picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={minDate}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              disabled={isLoading}
            />
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <Modal.Footer>
          <Modal.Close>
            <Button variant="secondary" disabled={isLoading}>
              Cancel
            </Button>
          </Modal.Close>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !selectedSessionId ||
              !dueDate ||
              availableSessions.length === 0
            }
          >
            {isLoading ? "Assigning..." : "Assign Session"}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
