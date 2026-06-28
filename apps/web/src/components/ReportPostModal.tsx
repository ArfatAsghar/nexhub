"use client";

import { useState } from "react";
import { Modal, Button } from "@nexhub/ui";
import { useReportPost } from "@/hooks/useReportPost";

export interface ReportPostModalProps {
  open: boolean;
  postId: string | null;
  onClose: () => void;
}

export function ReportPostModal({ open, postId, onClose }: ReportPostModalProps) {
  const { reportPost, pending, error } = useReportPost();
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!postId) return;
    const ok = await reportPost(postId, reason);
    if (ok) {
      setSubmitted(true);
      setReason("");
    }
  }

  function handleClose() {
    setSubmitted(false);
    setReason("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Report post">
      {submitted ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            Thanks — your report was submitted. Our team will review it.
          </p>
          <Button onClick={handleClose} className="self-end">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            Tell us why this post should be reviewed.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Spam, harassment, misinformation…"
            className="w-full resize-none rounded-card border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !reason.trim()}>
              {pending ? "Submitting…" : "Submit report"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
