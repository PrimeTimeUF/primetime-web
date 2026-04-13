"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type JoinStatus = "joining" | "success" | "error";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<JoinStatus>("joining");
  const [message, setMessage] = useState("Ready to join this course.");
  const invitationCode = useMemo(() => searchParams.get("code")?.trim().toUpperCase() ?? "", [searchParams]);
  const isSubmitting = status === "joining" && message === "Joining course...";

  useEffect(() => {
    if (!invitationCode) {
      setStatus("error");
      setMessage("Missing invitation code in QR link.");
      return;
    }

    setStatus("joining");
    setMessage("Ready to join this course.");
  }, [invitationCode]);

  async function handleJoin() {
    if (!invitationCode) {
      setStatus("error");
      setMessage("Missing invitation code in QR link.");
      return;
    }

    setStatus("joining");
    setMessage("Joining course...");

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode }),
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        // Some upstream failures can return non-JSON payloads.
      }

      if (response.ok || response.status === 409) {
        setStatus("success");
        setMessage(response.status === 409 ? "You are already enrolled. Redirecting..." : "Successfully joined! Redirecting...");
        setTimeout(() => {
          router.push("/student");
        }, 1200);
        return;
      }

      if (response.status === 401) {
        setStatus("error");
        setMessage("Please log in as a student, then scan the QR code again.");
        return;
      }

      if (response.status === 403) {
        setStatus("error");
        setMessage("Only student accounts can join courses.");
        return;
      }

      setStatus("error");
      setMessage(data.error || "Unable to join this course.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong while joining. Please try again.");
    }
  }

  const basePanel = "w-full max-w-xl border border-white/15 bg-white/[0.03] p-8";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
        <div className={basePanel}>
          <p className="font-mono text-[10px] tracking-[0.25em] text-white/40">COURSE JOIN</p>
          <h1 className="mt-3 font-mono text-2xl font-bold tracking-wider">
            {status === "success" ? "JOINED" : status === "error" ? "UNABLE TO JOIN" : isSubmitting ? "PROCESSING..." : "READY TO JOIN"}
          </h1>
          <p className="mt-3 font-mono text-sm text-white/70">{message}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleJoin}
              disabled={status === "success"}
              className="border border-white px-5 py-2 font-mono text-xs tracking-wider transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "JOINING..." : "JOIN COURSE"}
            </button>
            <Link
              href={status === "success" ? "/student" : "/login"}
              className="border border-white/30 px-5 py-2 font-mono text-xs tracking-wider text-white/70 transition-colors hover:border-white hover:text-white"
            >
              {status === "success" ? "GO TO DASHBOARD" : "GO TO LOGIN"}
            </Link>
            {status === "error" && (
              <Link
                href="/student"
                className="border border-white/30 px-5 py-2 font-mono text-xs tracking-wider text-white/70 transition-colors hover:border-white hover:text-white"
              >
                ENTER CODE MANUALLY
              </Link>
            )}
          </div>

          {isSubmitting && (
            <div className="mt-6 h-1 w-full overflow-hidden bg-white/10">
              <div className="h-full w-1/3 animate-pulse bg-white/60" />
            </div>
          )}

          {invitationCode && (
            <p className="mt-6 font-mono text-[10px] tracking-wider text-white/40">
              INVITE CODE: <span className="text-white/70">{invitationCode}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
