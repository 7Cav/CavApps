"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildRecommendationTitle,
  buildRecommendationBody,
} from "./lib/recommendation-export";

// The parent mounts a fresh submission for each generated snapshot.
export default function RecommendationSubmission({ recommendation }) {
  const title = buildRecommendationTitle(recommendation);
  const body = buildRecommendationBody(recommendation);
  const [feedback, setFeedback] = useState({});

  async function copy(field, value) {
    setFeedback((previous) => ({ ...previous, [field]: "pending" }));
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setFeedback((previous) => ({ ...previous, [field]: "copied" }));
    } catch {
      setFeedback((previous) => ({ ...previous, [field]: "error" }));
    }
  }

  return (
    <section
      aria-labelledby="submission-heading"
      className="space-y-4 border-t border-border/70 pt-6"
    >
      <h3
        id="submission-heading"
        className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
      >
        Recommendation Submission
      </h3>
      <p className="text-sm leading-6 text-muted-foreground">
        Copy the Recommendation Title, open the Medal Recommendation ticket in a
        new tab, and paste the title. Return here to copy the Recommendation
        Body, then paste it into the ticket and review before submitting.
      </p>
      {[
        { field: "title", label: "Title", value: title },
        { field: "body", label: "Body", value: body },
      ].map(({ field, label, value }) => (
        <div key={field} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={`recommendation-${field}`}
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Recommendation {label}
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={feedback[field] === "pending"}
              onClick={() => copy(field, value)}
            >
              {feedback[field] === "copied"
                ? `${label} Copied`
                : `Copy ${label}`}
            </Button>
          </div>
          {field === "title" ? (
            <Input id="recommendation-title" readOnly value={value} />
          ) : (
            <textarea
              id="recommendation-body"
              readOnly
              value={value}
              rows={14}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
          {feedback[field] === "copied" && (
            <p role="status" className="sr-only">
              {label} Copied
            </p>
          )}
          {feedback[field] === "error" && (
            <p role="alert" className="text-sm text-destructive">
              Copy failed. Select the text and copy it manually.
            </p>
          )}
        </div>
      ))}
      <Button
        asChild
        className="h-auto min-h-10 max-w-full whitespace-normal text-center"
      >
        <a
          href="https://7cav.us/tickets/categories/18/create"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-primary-foreground hover:!text-primary-foreground hover:!no-underline"
        >
          Open Medal Recommendation Ticket <span aria-hidden="true">↗</span>
        </a>
      </Button>
    </section>
  );
}
