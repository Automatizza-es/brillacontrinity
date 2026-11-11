import { safeErrorDiagnostic } from "./safe-error";

// Keep only a sanitized diagnostic, never an error carrying a request or session.
let lastCapturedError: { error: string; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error: safeErrorDiagnostic(error), at: Date.now() };
}

export const describeError = safeErrorDiagnostic;

// Includes h3's internal console.error calls. Unstructured arguments are omitted:
// messages, stacks and cause objects can contain credentials in unexpected formats.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (arg instanceof Error) record(arg);
    return safeErrorDiagnostic(arg);
  });
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): string | undefined {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
