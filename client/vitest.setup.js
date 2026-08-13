import "@testing-library/jest-dom/vitest";

process.env.COMBAT_API_URL = "https://combat-roster.test/";

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
