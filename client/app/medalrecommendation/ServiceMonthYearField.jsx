import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_MONTH_NAMES } from "./lib/citation-builders";
import { isServiceMonthValid } from "./lib/worksheet-validation";

export default function ServiceMonthYearField({
  id,
  label,
  value,
  isInvalid,
  describedBy,
  onChange,
}) {
  const [draft, setDraft] = useState("");
  const [year = "", month = ""] = (value || draft).split("-");

  function updateDraft(month, year) {
    const candidate = `${year}-${month}`;
    const isComplete = isServiceMonthValid(candidate);
    setDraft(isComplete ? "" : candidate);
    onChange(isComplete ? candidate : "");
  }

  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      <Select value={month} onValueChange={(month) => updateDraft(month, year)}>
        <SelectTrigger
          id={id}
          aria-label={`${label} Month`}
          aria-invalid={isInvalid ? "true" : undefined}
          aria-describedby={describedBy || undefined}
          className={
            isInvalid ? "border-destructive focus:ring-destructive" : undefined
          }
        >
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {SERVICE_MONTH_NAMES.map((month, index) => (
            <SelectItem key={month} value={String(index + 1).padStart(2, "0")}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="text"
        inputMode="numeric"
        maxLength={4}
        placeholder="YYYY"
        aria-label={`${label} Year`}
        aria-invalid={isInvalid ? "true" : undefined}
        aria-describedby={describedBy || undefined}
        className={`w-24 shrink-0 ${isInvalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
        value={year}
        onChange={(event) => {
          const year = event.target.value;
          if (/^\d{0,4}$/.test(year)) updateDraft(month, year);
        }}
      />
    </div>
  );
}
