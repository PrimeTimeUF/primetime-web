"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button, Input, Modal } from "@/components";

interface EnrollCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled: () => void;
}

export default function EnrollCourseModal({
  open,
  onOpenChange,
  onEnrolled,
}: Readonly<EnrollCourseModalProps>) {
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
      <Modal.Content size="sm">
        <Modal.Title>Enroll in Course</Modal.Title>
        <Modal.Description>
          Enter the invitation code from your teacher to join a course.
        </Modal.Description>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Invitation Code"
            placeholder="Enter code"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoComplete="off"
            className="text-center text-lg tracking-widest uppercase"
            required
          />
          <p className="text-xs text-gray-500 text-center">
            Ask your teacher for the course invitation code
          </p>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Modal.Footer>
            <Modal.Close>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Modal.Close>
            <Button type="submit" isLoading={isSubmitting}>
              Join Course
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal>
  );
}
