"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button, Input, Modal } from "@/components";

interface CreateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
}

export default function CreateCourseModal({
  open,
  onOpenChange,
  onCourseCreated,
}: Readonly<CreateCourseModalProps>) {
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
      <Modal.Content size="md">
        <Modal.Title>Create Course</Modal.Title>
        <Modal.Description>
          Fill in the details below to create a new course.
        </Modal.Description>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Course Title"
            placeholder="e.g. Introduction to Psychology"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label
              htmlFor="course-description"
              className="text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="course-description"
              placeholder="Brief course description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Code"
              placeholder="e.g. PSY 101"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              required
            />
            <Input
              label="Semester"
              placeholder="e.g. Fall 2026"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            />
          </div>

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
              Create Course
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal>
  );
}
