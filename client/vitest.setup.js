import "@testing-library/jest-dom/vitest";

// The feature's font is compiled by Next.js, not by Vitest. Keep this stub
// scoped to Medal Recommendation so other CavApps fonts are unaffected.
vi.mock("./app/medalrecommendation/lib/fonts", () => ({
  oswald: { className: "" },
}));

process.env.COMBAT_API_URL = "https://combat-roster.test/";
process.env.MEDAL_RECIPIENT_API_URL = "https://medal-recipient-roster.test/";

process.env.NEXT_PUBLIC_CLIENT_TOKEN = "test-client-token";

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
