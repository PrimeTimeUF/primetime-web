"use client";

import { useState, useEffect, FormEvent } from "react";
import { Modal } from "@/components";
import { BrutalistButton, BrutalistInput, themeTokens } from "@/components/ui/dashboard-primitives";

interface CreateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
  isDark?: boolean;
}

export default function CreateCourseModal({
  open,
  onOpenChange,
  onCourseCreated,
  isDark = true,
}: Readonly<CreateCourseModalProps>) {
  const t = themeTokens(isDark);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setCourseCode("");
      setSemester("");
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !courseCode.trim() || !semester.trim()) {
      setError("Title, course code, and semester are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          courseCode: courseCode.trim(),
          semester: semester.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create course.");
        return;
      }

      onCourseCreated();
      onOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md" isDark={isDark}>
        <Modal.Title>Create Course</Modal.Title>
        <Modal.Description>
          Fill in the details below to create a new course.
        </Modal.Description>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <BrutalistInput
            isDark={isDark}
            id="course-title"
            label="Course Title"
            placeholder="e.g. Introduction to Psychology"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="course-description" className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>
              Description
            </label>
            <textarea
              id="course-description"
              placeholder="Brief course description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-sm px-4 py-3 placeholder:opacity-30 focus:outline-none focus:border-current transition-colors duration-200 resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BrutalistInput
              isDark={isDark}
              id="course-code"
              label="Course Code"
              placeholder="e.g. PSY 101"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              required
            />
            <BrutalistInput
              isDark={isDark}
              id="course-semester"
              label="Semester"
              placeholder="e.g. Fall 2026"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className={`font-mono text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
          )}

          <Modal.Footer>
            <Modal.Close>
              <BrutalistButton type="button" isDark={isDark} variant="secondary" disabled={isSubmitting} className="w-full sm:w-auto">
                Cancel
              </BrutalistButton>
            </Modal.Close>
            <BrutalistButton type="submit" isDark={isDark} isLoading={isSubmitting} className="w-full sm:w-auto">
              CREATE COURSE
            </BrutalistButton>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal>
  );
}
