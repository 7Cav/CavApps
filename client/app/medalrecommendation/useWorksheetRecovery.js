"use client";

import { useEffect, useRef, useState } from "react";
import {
  prepareDraftRestore,
  serializeDraft,
} from "./lib/recommendation-drafts";
import { createRecoveryStore } from "./lib/worksheet-recovery-store";

export default function useWorksheetRecovery({
  medalFamily,
  roster,
  onRestore,
}) {
  const [status, setStatus] = useState({
    kind: "loading",
    message: "Checking browser recovery…",
  });
  const runtime = useRef(null);
  const generation = useRef(0);
  const callbacks = useRef({ roster, onRestore });
  callbacks.current = { roster, onRestore };

  function report(current, next, job) {
    if (
      current.active &&
      runtime.current === current &&
      (!job || current.latest === job)
    )
      setStatus(next);
  }

  function fail(current, error, job) {
    report(
      current,
      {
        kind: "warning",
        message: job?.clear
          ? `The worksheet is cleared, but previous browser recovery may still be present. ${error.message}`
          : `Browser recovery has not saved this worksheet. ${error.message}`,
      },
      job,
    );
  }

  function clearTimers(current) {
    clearTimeout(current.idleTimer);
    clearTimeout(current.maxTimer);
    current.idleTimer = current.maxTimer = null;
  }

  function flush(current) {
    clearTimers(current);
    const job = current.latest;
    if (!job) return Promise.resolve();
    if (job.flushing) return job.flushing;
    job.flushing = (async () => {
      const token = await job.registration;
      if (!token || current.latest !== job) return;
      try {
        const saved =
          job.clear ||
          (await current.store.commit(token, serializeDraft(job.snapshot)));
        report(
          current,
          saved
            ? { kind: "saved", message: "Worksheet saved in this browser." }
            : {
                kind: "warning",
                message:
                  "Another tab has newer edits. This worksheet was not saved.",
              },
          job,
        );
      } catch (error) {
        fail(current, error, job);
      }
    })();
    return job.flushing;
  }

  useEffect(() => {
    const current = {
      active: true,
      latest: null,
      idleTimer: null,
      maxTimer: null,
    };
    runtime.current = current;
    const startedAt = generation.current;
    setStatus({ kind: "loading", message: "Checking browser recovery…" });
    try {
      current.store = createRecoveryStore({
        onUnavailable: (error) => fail(current, error),
      });
      current.store
        .read(medalFamily)
        .then((result) => {
          if (
            !current.active ||
            runtime.current !== current ||
            generation.current !== startedAt
          )
            return;
          if (result.draft) {
            const prepared = prepareDraftRestore(
              result.draft,
              callbacks.current.roster,
            );
            callbacks.current.onRestore(prepared);
          }
          report(
            current,
            result.interrupted
              ? {
                  kind: "warning",
                  message: result.draft
                    ? "Recovered the last completed save. Newer edits were not saved before the previous session ended."
                    : "The previous session had unsaved edits, but no completed worksheet could be recovered.",
                }
              : {
                  kind: "ready",
                  message: result.draft
                    ? "Worksheet recovered from this browser."
                    : "",
                },
          );
        })
        .catch((error) => {
          if (generation.current === startedAt) fail(current, error);
        });
    } catch (error) {
      fail(current, error);
    }
    const hidden = () => {
      if (document.visibilityState === "hidden") void flush(current);
    };
    const pagehide = () => {
      void flush(current);
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pagehide);
    return () => {
      current.active = false;
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", pagehide);
      // Best effort only. The original revision still protects other tabs even
      // when this finishes after navigation. No new edit is created on cleanup.
      void flush(current).finally(() => current.store?.close());
    };
  }, [medalFamily]);

  function recordEdit(snapshot, { debounce = false, clear = false } = {}) {
    generation.current += 1;
    const current = runtime.current;
    if (!current?.store || !snapshot.medalId) return;
    const job = { snapshot, clear };
    current.latest = job;
    report(
      current,
      { kind: "pending", message: "Worksheet changes are not saved yet." },
      job,
    );
    try {
      // This call submits the lock immediately; it is never deferred by React
      // effects, debounce timers, serialization, or database initialization.
      job.registration = (
        clear
          ? current.store.clear(snapshot)
          : current.store.register(medalFamily)
      ).catch((error) => {
        fail(current, error, job);
        return null;
      });
    } catch (error) {
      job.registration = Promise.resolve(null);
      fail(current, error, job);
    }
    if (!debounce || clear) {
      void flush(current);
    } else {
      clearTimeout(current.idleTimer);
      current.idleTimer = setTimeout(() => {
        void flush(current);
      }, 500);
      current.maxTimer ??= setTimeout(() => {
        void flush(current);
      }, 2000);
    }
  }

  function cancelHydration() {
    generation.current += 1;
    setStatus((current) =>
      current.kind === "loading" ? { kind: "ready", message: "" } : current,
    );
  }

  return { recordEdit, cancelHydration, status };
}
