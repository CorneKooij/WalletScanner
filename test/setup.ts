import "@testing-library/jest-dom";

// Polyfill fetch if necessary (Node 18+ has fetch; keep for safety)
if (!(globalThis as any).fetch) {
  // dynamic import to avoid ESM issues if not needed
  import("node-fetch")
    .then(({ default: fetch }) => {
      (globalThis as any).fetch = fetch as any;
    })
    .catch(() => {
      /* no-op */
    });
}
