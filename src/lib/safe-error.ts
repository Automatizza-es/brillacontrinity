const ERROR_NAMES = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "URIError",
  "AbortError",
  "AuthApiError",
  "AuthSessionMissingError",
  "AuthRetryableFetchError",
  "PostgrestError",
  "HTTPError",
]);
const ERROR_CODES = new Set(["42501", "23505", "23503", "23514", "PGRST116", "PGRST301"]);

/** Allowlisted diagnostics only: never serialize messages, stacks, requests or causes.
 * Redaction by token pattern alone cannot reliably recognize arbitrary passwords.
 */
export function safeErrorDiagnostic(error: unknown): string {
  if (error === null || typeof error !== "object") return "Application error (details omitted)";
  try {
    const value = error as {
      name?: unknown;
      status?: unknown;
      statusCode?: unknown;
      code?: unknown;
    };
    const name =
      typeof value.name === "string" && ERROR_NAMES.has(value.name) ? value.name : "Error";
    const status = value.status ?? value.statusCode;
    const statusLabel =
      typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599
        ? ` status=${status}`
        : "";
    const code =
      typeof value.code === "string" && ERROR_CODES.has(value.code) ? ` code=${value.code}` : "";
    return `${name}${statusLabel}${code} (details omitted)`;
  } catch {
    return "Application error (details omitted)";
  }
}
