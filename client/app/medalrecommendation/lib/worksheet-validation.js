import { isWorksheetFieldActive } from "./worksheet-profiles.js";

export function isOperationDateValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  const now = new Date();
  const localToday = [
    String(now.getFullYear()).padStart(4, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return value <= localToday;
}

export function isServiceMonthValid(value) {
  return (
    typeof value === "string" && /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value)
  );
}

function validateField(field, value, values) {
  if (!field.required) {
    return true;
  }

  switch (field.type) {
    case "text":
    case "textarea":
      return typeof value === "string" && Boolean(value.trim());

    case "date":
      return isOperationDateValid(value);

    case "monthYear": {
      if (!isServiceMonthValid(value)) {
        return "Required";
      }

      const now = new Date();
      const currentMonth = [
        String(now.getFullYear()).padStart(4, "0"),
        String(now.getMonth() + 1).padStart(2, "0"),
      ].join("-");

      if (value > currentMonth) {
        return `${field.label} must be the current month or earlier`;
      }

      const start = values[field.notBefore];
      if (
        field.notBefore &&
        isServiceMonthValid(start) &&
        start <= currentMonth &&
        value < start
      ) {
        return field.invalidMessage ?? false;
      }

      return true;
    }

    case "citationChoice":
    case "semanticChoice":
      return (
        Array.isArray(field.options) &&
        field.options.some((option) => option.id === value)
      );

    default:
      return false;
  }
}

export function validateWorksheet(worksheet, values = {}) {
  if (!worksheet?.fields) {
    return {
      fields: {},
      isComplete: false,
    };
  }

  const fields = {};
  const errors = {};

  for (const [fieldName, field] of Object.entries(worksheet.fields)) {
    if (isWorksheetFieldActive(field, values)) {
      const result = validateField(field, values[fieldName], values);
      fields[fieldName] = result === true;
      if (typeof result === "string") {
        errors[fieldName] = result;
      }
    }
  }

  return {
    fields,
    ...(Object.keys(errors).length ? { errors } : {}),
    isComplete: Object.values(fields).every(Boolean),
  };
}
