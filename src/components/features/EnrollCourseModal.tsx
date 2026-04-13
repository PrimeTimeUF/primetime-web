"use client";

import { useState, useEffect, FormEvent } from "react";
import { Modal } from "@/components";
import { BrutalistButton, BrutalistInput, themeTokens } from "@/components/ui/dashboard-primitives";

interface EnrollCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled: () => void;
  isDark?: boolean;
}

export default function EnrollCourseModal({
  open,
  onOpenChange,
  onEnrolled,
  isDark = true,
}: Readonly<EnrollCourseModalProps>) {
  const t = themeTokens(isDark);
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setInvitationCode("");
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const code = invitationCode.trim();
    if (!code) {
      setError("Please enter an invitation code.");
      return;
    }

    if (code.length < 6) {
      setError("Invitation code must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to enroll in course.");
        return;
      }

      onEnrolled();
      onOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="sm" isDark={isDark}>
        <Modal.Title>Enroll in Course</Modal.Title>
        <Modal.Description>
          Enter the invitation code from your teacher, or use their QR join link.
        </Modal.Description>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <BrutalistInput
            isDark={isDark}
            id="invitation-code"
            label="Invitation Code"
            placeholder="ENTER CODE"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoComplete="off"
            className="text-center text-lg tracking-widest uppercase"
            required
          />
          <p className={`font-mono text-[10px] ${t.textDim} tracking-wider text-center`}>
            Ask your teacher for the course invitation code
          </p>

          {error && (
            <p className={`font-mono text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
          )}

          <Modal.Footer>
            <Modal.Close>
              <BrutalistButton type="button" isDark={isDark} variant="secondary" disabled={isSubmitting}>
                Cancel
              </BrutalistButton>
            </Modal.Close>
            <BrutalistButton type="submit" isDark={isDark} isLoading={isSubmitting}>
              JOIN COURSE
            </BrutalistButton>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal>
  );
}
