// Award-name string fragments matched in logic (includes/replace/equality).
// Not the full award-name catalog — only the fragments duplicated across files.
export const AwardNameFragment = Object.freeze({
  // Matched bare via .includes(); the " " + form is the suffix stripped via .replace().
  VALOR_DEVICE: "with Valor Device",
});

// Does this award name carry the " with Valor Device" suffix?
export function hasValorDevice(awardName) {
  return awardName.includes(AwardNameFragment.VALOR_DEVICE);
}

// Strip the " with Valor Device" suffix, returning the base award name.
export function stripValorDevice(awardName) {
  return awardName.replace(" " + AwardNameFragment.VALOR_DEVICE, "");
}
