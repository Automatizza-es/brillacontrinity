import { describe, expect, it, vi } from "vitest";
import { safeErrorDiagnostic } from "@/lib/safe-error";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { renderErrorPage } from "@/lib/error-page";

const sensitive = "synthetic-password-and-token-never-log";
describe("credential-safe diagnostics", () => {
  it.each([
    new Error(`Bearer ${sensitive}`, { cause: { password: sensitive } }),
    {
      message: sensitive,
      access_token: sensitive,
      refresh_token: sensitive,
      request: { cookie: sensitive },
    },
    `sb_secret_${sensitive}`,
    { name: sensitive, status: sensitive, code: sensitive },
  ])("does not expose credentials or arbitrary fields", (error) => {
    const output = safeErrorDiagnostic(error);
    expect(output).not.toContain(sensitive);
    expect(output).not.toContain("access_token");
    expect(output).toContain("omitted");
  });
  it("preserves only known categories and useful status/code", () => {
    expect(
      safeErrorDiagnostic({
        name: "PostgrestError",
        status: 403,
        code: "42501",
        message: sensitive,
      }),
    ).toBe("PostgrestError status=403 code=42501 (details omitted)");
  });
  it("handles throwing accessors without exposing their errors", () => {
    expect(
      safeErrorDiagnostic({
        get name() {
          throw new Error(sensitive);
        },
      }),
    ).not.toContain(sensitive);
  });
  it("sends neither raw errors nor arbitrary context to telemetry", () => {
    const captureException = vi.fn();
    const report = vi.fn();
    window.__lovableEvents = { captureException };
    window.__lovableReportRuntimeError = report;
    try {
      reportLovableError(new Error(sensitive, { cause: { secret: sensitive } }), {
        secret: sensitive,
      });
      const [error, context] = captureException.mock.calls[0]!;
      expect(error.message).not.toContain(sensitive);
      expect(error.cause).toBeUndefined();
      expect(JSON.stringify(context)).not.toContain(sensitive);
      expect(JSON.stringify(report.mock.calls)).not.toContain(sensitive);
    } finally {
      delete window.__lovableEvents;
      delete window.__lovableReportRuntimeError;
    }
  });
  it("keeps the public error page independent of exception details", () => {
    expect(renderErrorPage()).not.toContain(sensitive);
    expect(renderErrorPage()).not.toContain("access_token");
  });
  it("sanitizes actual server console.error arguments and stored diagnostics", async () => {
    const original = console.error;
    const output = vi.fn();
    console.error = output;
    try {
      const { consumeLastCapturedError } = await import("@/lib/error-capture");
      console.error(new Error(sensitive), { authorization: sensitive }, sensitive);
      expect(JSON.stringify(output.mock.calls)).not.toContain(sensitive);
      expect(consumeLastCapturedError()).not.toContain(sensitive);
    } finally {
      console.error = original;
    }
  });
});
