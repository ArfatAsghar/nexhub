"use client";

import { useState } from "react";
import { Modal, Button, cn } from "@nexhub/ui";
import { POST_TYPES, MAX_POST_TAGS, type PostType, type Database } from "@nexhub/types";
import { useCreatePost, type CreatePostInput } from "@/hooks/useCreatePost";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

const POST_TYPE_LABEL: Record<PostType, string> = {
  question: "Question",
  project: "Project",
  lesson: "Lesson",
  discussion: "Discussion",
};

const CODE_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "go",
  "rust",
  "sql",
  "html",
  "css",
];

export interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a post is successfully created, so the feed can prepend it. */
  onCreated?: (post: PostRow) => void;
}

export function NewPostModal({ open, onClose, onCreated }: NewPostModalProps) {
  const { createPost, pending, error } = useCreatePost();

  const [type, setType] = useState<PostType>("discussion");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState(CODE_LANGUAGES[0]);

  function resetForm() {
    setType("discussion");
    setContent("");
    setTagInput("");
    setTags([]);
    setShowCode(false);
    setCodeSnippet("");
    setCodeLanguage(CODE_LANGUAGES[0]);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function addTagFromInput() {
    const cleaned = tagInput.trim().replace(/^#/, "");
    if (!cleaned) return;
    if (tags.includes(cleaned)) {
      setTagInput("");
      return;
    }
    if (tags.length >= MAX_POST_TAGS) return;
    setTags((prev) => [...prev, cleaned]);
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input: CreatePostInput = {
      type,
      content,
      tags,
      ...(showCode && codeSnippet
        ? { codeSnippet, codeLanguage }
        : {}),
    };

    const created = await createPost(input);
    if (created) {
      onCreated?.(created);
      handleClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create post">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you working on, learning, or asking?"
          rows={4}
          required
          className="resize-none rounded-card border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Post type
          </p>
          <div className="flex gap-2">
            {POST_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-pill border px-3 py-1 text-xs transition-colors",
                  type === t
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-ink-muted hover:border-ink-faint",
                )}
              >
                {POST_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Tags ({tags.length}/{MAX_POST_TAGS})
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                className="rounded-pill bg-canvas-overlay px-2 py-0.5 text-xs text-ink-muted hover:text-danger"
              >
                #{tag} ×
              </button>
            ))}
            {tags.length < MAX_POST_TAGS && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTagFromInput();
                  }
                }}
                onBlur={addTagFromInput}
                placeholder="Add a tag, press Enter"
                className="min-w-[120px] flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
              />
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={showCode}
              onChange={(e) => setShowCode(e.target.checked)}
              className="accent-accent"
            />
            Add code snippet
          </label>

          {showCode && (
            <div className="mt-2 flex flex-col gap-2">
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="w-fit rounded-card border border-border bg-canvas px-2 py-1 text-xs text-ink"
              >
                {CODE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste your code…"
                rows={5}
                className="resize-none rounded-card border border-border bg-[#0d1117] px-3 py-2 font-code text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}