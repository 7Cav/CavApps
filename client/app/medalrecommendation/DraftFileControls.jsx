"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildDraftFilename,
  checkDraftSize,
  parseDraft,
  prepareDraftRestore,
  serializeDraft,
} from "./lib/recommendation-drafts";

const HEADER_CONTROL_CLASS_NAME =
  "h-16 w-20 flex-col gap-1 px-2 py-2 [&_svg]:size-5";

export default function DraftFileControls({
  state,
  roster,
  hasWork,
  onRestore,
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const request = useRef(0);
  const reader = useRef(null);

  useEffect(
    () => () => {
      request.current += 1;
      reader.current?.abort();
    },
    [],
  );

  function changeOpen(value) {
    request.current += 1;
    reader.current?.abort();
    setOpen(value);
    setPending(null);
    setError("");
    setReading(false);
  }

  function apply(prepared) {
    onRestore(prepared);
    changeOpen(false);
    setDownloadError("");
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const token = ++request.current;
    reader.current?.abort();
    setPending(null);
    setError("");
    setReading(true);
    try {
      checkDraftSize(file.size);
      const bytes = await new Promise((resolve, reject) => {
        const current = new FileReader();
        reader.current = current;
        current.onload = () => resolve(current.result);
        current.onerror = () =>
          reject(new Error("The selected file could not be read."));
        current.onabort = () => reject(new Error("File reading was canceled."));
        current.readAsArrayBuffer(file);
      });
      if (token !== request.current) return;
      let text;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new Error("The draft must use UTF-8 text encoding.");
      }
      const draft = parseDraft(text, state.medalFamily);
      const prepared = prepareDraftRestore(draft, roster);
      if (hasWork) setPending(prepared);
      else apply(prepared);
    } catch (failure) {
      if (token === request.current) setError(failure.message);
    } finally {
      if (token === request.current) setReading(false);
    }
  }

  function download() {
    setDownloadError("");
    try {
      const text = serializeDraft(state);
      // Use the same preparation checks as Load so this download cannot
      // introduce duplicate resolved identities when it is loaded again.
      prepareDraftRestore(parseDraft(text, state.medalFamily), roster);
      const url = URL.createObjectURL(
        new Blob([text], { type: "application/json;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      try {
        anchor.href = url;
        anchor.download = buildDraftFilename(state);
        document.body.appendChild(anchor);
        anchor.click();
      } finally {
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    } catch (failure) {
      setDownloadError(failure.message);
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Dialog open={open} onOpenChange={changeOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={HEADER_CONTROL_CLASS_NAME}
            >
              <FolderOpen aria-hidden="true" />
              <span>Load</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogTitle className="pr-8 text-xl font-semibold">
              Load worksheet draft
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              Choose a local JSON draft for this medal family. Files are
              processed on your device. The maximum file size is 1 MiB.
            </DialogDescription>
            <div className="mt-4 space-y-3">
              <label
                htmlFor="medal-draft-file"
                className="text-sm font-semibold"
              >
                Draft file
              </label>
              <Input
                id="medal-draft-file"
                type="file"
                accept=".json,application/json"
                onChange={chooseFile}
              />
              {reading && <p role="status">Reading draft…</p>}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              {pending && (
                <p role="status">
                  The draft is ready. Replace the current worksheet? Generated
                  output will be cleared.
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                {pending && (
                  <Button type="button" onClick={() => apply(pending)}>
                    Replace Worksheet
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          type="button"
          variant="ghost"
          className={HEADER_CONTROL_CLASS_NAME}
          disabled={!state.medalId}
          onClick={download}
        >
          <Download aria-hidden="true" />
          <span>Download</span>
        </Button>
      </div>
      {downloadError && (
        <p role="alert" className="text-sm text-destructive">
          {downloadError}
        </p>
      )}
    </div>
  );
}
