"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FolderOpen, Save } from "lucide-react";
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
  normalizeDraftName,
  parseDraft,
  prepareDraftRestore,
  serializeDraft,
  suggestDraftName,
} from "./lib/recommendation-drafts";
import { createNamedDraftStore } from "./lib/named-draft-store";
import { getMedalFamily } from "./lib/medal-families";

const HEADER_CONTROL_CLASS_NAME =
  "h-16 w-20 flex-col gap-1 px-2 py-2 [&_svg]:size-5";

export default function DraftFileControls({
  state,
  roster,
  hasWork,
  onRestore,
  onLoadStart,
  binding,
  sessionId,
  onNamedSaved,
  onNamedRenamed,
  onNamedDeleted,
}) {
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTarget, setSaveTarget] = useState(null);
  const [saveMode, setSaveMode] = useState("new");
  const [name, setName] = useState("");
  const [rows, setRows] = useState([]);
  const [listing, setListing] = useState(false);
  const [listError, setListError] = useState("");
  const [manage, setManage] = useState(null);
  const [pending, setPending] = useState(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  const listRequest = useRef(0);
  const reader = useRef(null);
  const database = useRef(null);
  const mounted = useRef(false);
  const mode = useRef(null);
  const nameEdited = useRef(false);
  const nameInput = useRef(null);
  const listHeading = useRef(null);
  const manageBack = useRef(null);
  const latest = useRef(null);
  latest.current = {
    state,
    roster,
    hasWork,
    sessionId,
    onRestore,
    onNamedSaved,
    onNamedRenamed,
    onNamedDeleted,
  };

  useEffect(() => {
    mounted.current = true;
    const store = createNamedDraftStore();
    database.current = store;
    return () => {
      mounted.current = false;
      request.current++;
      listRequest.current++;
      reader.current?.abort();
      store.close();
    };
  }, [state.medalFamily]);

  useEffect(() => {
    request.current++;
    listRequest.current++;
    reader.current?.abort();
    mode.current = null;
    setOpen(false);
    setSaveOpen(false);
    setNotice("");
    setError("");
    setDownloadError("");
  }, [sessionId]);

  useEffect(() => {
    if (manage?.kind === "rename") nameInput.current?.focus();
    else if (manage) manageBack.current?.focus();
  }, [manage]);

  function returnToList() {
    setManage(null);
    setError("");
    // The management view unmounts its focused control; keep keyboard focus
    // inside the same dialog when the list is rendered again.
    requestAnimationFrame(() => listHeading.current?.focus());
  }

  function active(token, session) {
    return (
      mounted.current &&
      token === request.current &&
      session === latest.current.sessionId
    );
  }

  function resetDialog(nextMode) {
    mode.current = nextMode;
    request.current++;
    listRequest.current++;
    reader.current?.abort();
    setPending(null);
    setManage(null);
    setError("");
    setReading(false);
  }

  async function refreshList(nextMode) {
    const token = ++listRequest.current;
    const session = latest.current.sessionId;
    setListing(true);
    setListError("");
    try {
      const result = await database.current.list(
        latest.current.state.medalFamily,
      );
      if (
        !mounted.current ||
        token !== listRequest.current ||
        mode.current !== nextMode ||
        session !== latest.current.sessionId
      )
        return null;
      setRows(result);
      return result;
    } catch (failure) {
      if (
        mounted.current &&
        token === listRequest.current &&
        session === latest.current.sessionId
      )
        setListError(failure.message);
      return null;
    } finally {
      if (mounted.current && token === listRequest.current) setListing(false);
    }
  }

  function changeOpen(value) {
    if (value) onLoadStart?.();
    resetDialog(value ? "load" : null);
    setOpen(value);
    if (value) {
      setRows([]);
      void refreshList("load");
    }
  }

  async function changeSaveOpen(value) {
    resetDialog(value ? "save" : null);
    setSaveOpen(value);
    if (!value) return;
    setSaveTarget(binding ?? null);
    setSaveMode(binding ? "choice" : "new");
    nameEdited.current = false;
    let base = buildDraftFilename(latest.current.state).replace(/\.json$/, "");
    try {
      base = normalizeDraftName(
        binding?.name ?? latest.current.state.name ?? base,
      );
    } catch {
      /* Imported metadata need not be a valid browser name. */
    }
    setName(base);
    const result = await refreshList("save");
    if (result && !binding && !nameEdited.current)
      setName(
        suggestDraftName(
          base,
          result.filter((row) => row.canDelete).map((row) => row.name),
        ),
      );
  }

  function copyMode() {
    try {
      setName(
        suggestDraftName(name, [
          ...rows.filter((row) => row.canDelete).map((row) => row.name),
          name,
        ]),
      );
      nameEdited.current = true;
      setSaveMode("new");
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }

  async function save() {
    const token = ++request.current;
    const current = latest.current;
    setReading(true);
    setError("");
    try {
      const chosen = normalizeDraftName(name);
      // Capture and serialize now, before storage can await database opening.
      const text = serializeDraft({ ...current.state, name: chosen });
      prepareDraftRestore(
        parseDraft(text, current.state.medalFamily),
        current.roster,
      );
      const result =
        saveMode === "overwrite"
          ? await database.current.overwrite(
              current.state.medalFamily,
              saveTarget.id,
              saveTarget.revision,
              text,
              chosen,
            )
          : await database.current.create(
              current.state.medalFamily,
              text,
              chosen,
            );
      if (!active(token, current.sessionId)) return;
      latest.current.onNamedSaved(result, current.sessionId);
      changeSaveOpen(false);
      setNotice(`Saved named draft “${result.name}”.`);
    } catch (failure) {
      if (active(token, current.sessionId)) setError(failure.message);
    } finally {
      if (active(token, current.sessionId)) setReading(false);
    }
  }

  function apply(prepared, record, session) {
    latest.current.onRestore(prepared, record ?? null, session);
    changeOpen(false);
    setDownloadError("");
  }

  async function loadNamed(record, confirmed = false) {
    const token = ++request.current;
    const current = latest.current;
    reader.current?.abort();
    setPending(null);
    setError("");
    setReading(true);
    try {
      // Re-read on confirmation: a pending dialog does not authorize loading
      // content that another tab has changed or deleted in the meantime.
      const saved = await database.current.read(
        current.state.medalFamily,
        record.id,
        record.revision,
      );
      if (!active(token, current.sessionId)) return;
      const prepared = prepareDraftRestore(
        parseDraft(saved.draftJSON, current.state.medalFamily),
        latest.current.roster,
      );
      if (!confirmed && latest.current.hasWork)
        setPending({ kind: "named", record: saved });
      else apply(prepared, saved, current.sessionId);
    } catch (failure) {
      if (active(token, current.sessionId)) setError(failure.message);
    } finally {
      if (active(token, current.sessionId)) setReading(false);
    }
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const token = ++request.current;
    const current = latest.current;
    reader.current?.abort();
    setPending(null);
    setError("");
    setReading(true);
    try {
      checkDraftSize(file.size);
      const bytes = await new Promise((resolve, reject) => {
        const readingFile = new FileReader();
        reader.current = readingFile;
        readingFile.onload = () => resolve(readingFile.result);
        readingFile.onerror = () =>
          reject(new Error("The selected file could not be read."));
        readingFile.onabort = () =>
          reject(new Error("File reading was canceled."));
        readingFile.readAsArrayBuffer(file);
      });
      if (!active(token, current.sessionId)) return;
      let text;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new Error("The draft must use UTF-8 text encoding.");
      }
      const draft = parseDraft(text, current.state.medalFamily);
      const prepared = prepareDraftRestore(draft, latest.current.roster);
      if (latest.current.hasWork) setPending({ kind: "file", prepared });
      else apply(prepared, null, current.sessionId);
    } catch (failure) {
      if (active(token, current.sessionId)) setError(failure.message);
    } finally {
      if (active(token, current.sessionId)) setReading(false);
    }
  }

  async function manageDraft() {
    const token = ++request.current;
    const current = latest.current;
    const { record, kind } = manage;
    setReading(true);
    setError("");
    try {
      const result =
        kind === "rename"
          ? await database.current.rename(
              current.state.medalFamily,
              record.id,
              record.revision,
              name,
            )
          : await database.current.remove(
              current.state.medalFamily,
              record.id,
              record.revision,
            );
      if (!active(token, current.sessionId)) return;
      if (kind === "rename")
        latest.current.onNamedRenamed(
          result,
          record.revision,
          current.sessionId,
        );
      else latest.current.onNamedDeleted(result, current.sessionId);
      returnToList();
      setNotice(
        kind === "rename"
          ? "Saved draft renamed."
          : "Saved draft deleted. Your worksheet was not changed.",
      );
      void refreshList("load");
    } catch (failure) {
      if (active(token, current.sessionId)) setError(failure.message);
    } finally {
      if (active(token, current.sessionId)) setReading(false);
    }
  }

  function download() {
    setDownloadError("");
    try {
      const text = serializeDraft(state);
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

  const nameField = (
    <div className="space-y-2">
      <label htmlFor="browser-draft-name" className="text-sm font-semibold">
        Draft name
      </label>
      <Input
        ref={nameInput}
        id="browser-draft-name"
        value={name}
        disabled={reading}
        onChange={(event) => {
          nameEdited.current = true;
          setName(event.target.value);
        }}
      />
    </div>
  );

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Dialog open={saveOpen} onOpenChange={changeSaveOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={HEADER_CONTROL_CLASS_NAME}
              disabled={!state.medalId}
            >
              <Save aria-hidden="true" />
              <span>Save</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogTitle className="pr-8 text-xl font-semibold">
              Save worksheet draft
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              Named drafts stay in this browser profile, shared by anyone using
              it. They do not sync across devices.
            </DialogDescription>
            <div className="mt-4 space-y-3">
              {nameField}
              {listError && (
                <p className="text-sm text-amber-400">{listError}</p>
              )}
              {saveMode === "overwrite" && (
                <p className="text-sm break-words">
                  Overwrite saved draft “{saveTarget.name}” with this worksheet?
                  Its previous saved content will be replaced.
                </p>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              {reading && <p role="status">Saving draft…</p>}
              <div className="flex flex-wrap justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                {saveMode === "choice" ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => setSaveMode("overwrite")}
                    >
                      Overwrite this draft
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={listing}
                      onClick={copyMode}
                    >
                      Save as separate copy
                    </Button>
                  </>
                ) : (
                  <>
                    {saveTarget && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={reading || listing}
                        onClick={copyMode}
                      >
                        Save as separate copy
                      </Button>
                    )}
                    <Button
                      type="button"
                      disabled={reading || listing}
                      onClick={save}
                    >
                      {saveMode === "overwrite"
                        ? "Confirm Overwrite"
                        : "Save new draft"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              Choose a saved browser draft or a local JSON file for this medal
              family. Files are processed on your device. The maximum file size
              is 1 MiB.
            </DialogDescription>
            <div className="mt-4 space-y-4">
              {manage ? (
                <section
                  aria-label={
                    manage.kind === "rename"
                      ? "Rename saved draft"
                      : "Delete saved draft"
                  }
                  className="space-y-3"
                >
                  <p className="text-sm break-words">
                    {manage.kind === "rename" ? "Rename" : "Delete"} “
                    {manage.record.name}”
                    {manage.kind === "delete"
                      ? "? This removes the saved copy, not your current worksheet."
                      : ""}
                  </p>
                  {manage.kind === "rename" && nameField}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      ref={manageBack}
                      type="button"
                      variant="outline"
                      disabled={reading}
                      onClick={returnToList}
                    >
                      Back to drafts
                    </Button>
                    <Button
                      type="button"
                      disabled={reading}
                      variant={
                        manage.kind === "delete" ? "destructive" : "default"
                      }
                      onClick={manageDraft}
                    >
                      {manage.kind === "rename"
                        ? "Confirm Rename"
                        : "Confirm Delete"}
                    </Button>
                  </div>
                </section>
              ) : (
                <>
                  <section
                    aria-labelledby="saved-browser-drafts"
                    className="space-y-3"
                  >
                    <h3
                      ref={listHeading}
                      tabIndex={-1}
                      id="saved-browser-drafts"
                      className="font-semibold"
                    >
                      Saved in this browser
                    </h3>
                    {listing && <p role="status">Reading saved drafts…</p>}
                    {listError && (
                      <p className="text-sm text-amber-400">{listError}</p>
                    )}
                    {!listing && !listError && rows.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No saved drafts for this medal family.
                      </p>
                    )}
                    <ul className="space-y-3">
                      {rows.map((record) => (
                        <li
                          key={record.id}
                          className="min-w-0 rounded-md border border-border p-3"
                          aria-label={record.name}
                        >
                          <p className="font-medium break-words">
                            {record.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getMedalFamily(state.medalFamily).getMedalById(
                              record.medalId,
                            )?.name ?? "Unavailable medal"}{" "}
                            · {new Date(record.modifiedAt).toLocaleString()}
                          </p>
                          {record.error && (
                            <p className="text-sm text-amber-400">
                              {record.error}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={reading || Boolean(record.error)}
                              onClick={() => loadNamed(record)}
                            >
                              Load draft
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={reading || Boolean(record.error)}
                              onClick={() => {
                                setManage({ kind: "rename", record });
                                setName(record.name);
                                setPending(null);
                                setError("");
                              }}
                            >
                              Rename
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={reading || !record.canDelete}
                              onClick={() => {
                                setManage({ kind: "delete", record });
                                setPending(null);
                                setError("");
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section
                    aria-labelledby="import-draft-file"
                    className="space-y-3 border-t border-border pt-4"
                  >
                    <h3 id="import-draft-file" className="font-semibold">
                      Import a draft file
                    </h3>
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
                  </section>
                </>
              )}
              {reading && <p role="status">Working with draft…</p>}
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
                  <Button
                    type="button"
                    disabled={reading}
                    onClick={() =>
                      pending.kind === "named"
                        ? loadNamed(pending.record, true)
                        : apply(pending.prepared, null, sessionId)
                    }
                  >
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
      {notice && (
        <p
          role="status"
          aria-label="Named Draft Status"
          className="text-sm break-words"
        >
          {notice}
        </p>
      )}
      {downloadError && (
        <p role="alert" className="text-sm text-destructive">
          {downloadError}
        </p>
      )}
    </div>
  );
}
