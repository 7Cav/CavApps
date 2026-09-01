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

function validateField(field, value) {
  if (!field.required) {
    return true;
  }

  switch (field.type) {
    case "text":
    case "textarea":
      return typeof value === "string" && Boolean(value.trim());

    case "date":
      return isOperationDateValid(value);

    case "citationChoice":
    case "scopeChoice":
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

  for (const [fieldName, field] of Object.entries(worksheet.fields)) {
    fields[fieldName] = validateField(field, values[fieldName]);
  }

  return {
    fields,
    isComplete: Object.values(fields).every(Boolean),
  };
}
