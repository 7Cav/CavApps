"use client";

import { useEffect, useRef, useState } from "react";
import {
  prepareDraftRestore,
  serializeDraft,
} from "./lib/recommendation-drafts";
import {
  createRecoveryStore,
  RecoveryConflictError,
  sameRecoveryHead,
} from "./lib/worksheet-recovery-store";

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
      (current.conflict || !job || current.latest === job)
    )
      setStatus(
        current.conflict
          ? {
              kind: "warning",
              message:
                "Another tab has newer changes. This worksheet isn't being saved. Download a copy before reloading.",
            }
          : next,
      );
  }

  function fail(current, error, job) {
    if (error instanceof RecoveryConflictError) {
      current.conflict = true;
      clearTimers(current);
    }
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
        if (!saved && current.latest === job)
          fail(current, new RecoveryConflictError(), job);
        else if (saved)
          report(
            current,
            { kind: "saved", message: "Worksheet saved in this browser." },
            job,
          );
      } catch (error) {
        fail(current, error, job);
      }
    })();
    return job.flushing;
  }

  function checkFreshness(current) {
    if (
      !current.store ||
      current.hydrating ||
      current.conflict ||
      current.checking
    )
      return;
    current.checking = (async () => {
      try {
        while (current.active && !current.conflict) {
          const registration = current.registration;
          await registration;
          // Recheck if an edit joined the queue while this read was pending.
          const head = await current.store.readHead(medalFamily);
          if (registration !== current.registration) continue;
          if (!sameRecoveryHead(head, current.observed))
            fail(current, new RecoveryConflictError());
          return;
        }
      } catch (error) {
        fail(current, error);
      } finally {
        current.checking = null;
      }
    })();
  }

  useEffect(() => {
    const current = {
      active: true,
      latest: null,
      idleTimer: null,
      maxTimer: null,
      observed: null,
      registration: Promise.resolve(null),
      hydrating: true,
      conflict: false,
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
          const prepared = result.draft
            ? prepareDraftRestore(result.draft, callbacks.current.roster)
            : null;
          // Only accepted, validated hydration authorizes this base. A canceled
          // read must never lend its head to an already-edited local worksheet.
          current.observed = result.head ?? null;
          current.registration = Promise.resolve(current.observed);
          if (prepared) callbacks.current.onRestore(prepared);
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
        })
        .finally(() => {
          current.hydrating = false;
        });
    } catch (error) {
      current.hydrating = false;
      fail(current, error);
    }
    const visibility = () => {
      if (document.visibilityState === "hidden") void flush(current);
      else checkFreshness(current);
    };
    const focus = () => checkFreshness(current);
    const pagehide = () => {
      void flush(current);
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", focus);
    window.addEventListener("pagehide", pagehide);
    return () => {
      current.active = false;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", focus);
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
    if (current.conflict) {
      job.registration = Promise.resolve(null);
      return;
    }
    try {
      // This call submits the lock immediately; it is never deferred by React
      // effects, debounce timers, serialization, or database initialization.
      const previous = current.registration;
      const registration = clear
        ? current.store.clear(snapshot, previous)
        : current.store.register(medalFamily, previous);
      current.registration = registration.then(
        (token) => {
          current.observed = token;
          return token;
        },
        (error) => {
          // Poison queued successors after a conflict. Other failures retain the
          // previous base so a later edit can retry without adopting external work.
          if (error instanceof RecoveryConflictError) throw error;
          return previous;
        },
      );
      // A last conflicting edit may have no successor to consume its rejection.
      void current.registration.catch(() => {});
      job.registration = registration.catch((error) => {
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
