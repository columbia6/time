import { expect, test, describe } from "bun:test";
import {
    sleep,
    formatDuration,
    parseDuration,
    formatDate,
    parseDate,
    Second,
    Minute,
    Hour
} from "./index";

describe("Time & Duration Utility Tests", () => {

    describe("sleep()", () => {
        test("should resolve after specified duration", async () => {
            const start = Date.now();
            await sleep(100);
            const end = Date.now();
            // Allow a small buffer for timer imprecision
            expect(end - start).toBeGreaterThanOrEqual(95);
        });

        test("should resolve immediately if ms <= 0", async () => {
            const start = Date.now();
            await sleep(-50);
            const end = Date.now();
            expect(end - start).toBeLessThan(10);
        });

        test("ExceptionMode: should throw when AbortSignal is triggered", async () => {
            const controller = new AbortController();
            const promise = sleep(1000, { signal: controller.signal });
            controller.abort("timeout_error");
            expect(promise).rejects.toBe("timeout_error");
        });

        test("SilentMode: should return reason object when AbortSignal is triggered", async () => {
            const controller = new AbortController();
            const promise = sleep(1000, { signal: controller.signal, silent: true });
            controller.abort("cancel_request");
            const result = await promise;
            expect(result).toEqual({ reason: "cancel_request" });
        });

        test("should handle already aborted signal immediately", async () => {
            const controller = new AbortController();
            controller.abort("already_stopped");
            const promise = sleep(1000, { signal: controller.signal, silent: true });
            const result = await promise;
            expect(result).toEqual({ reason: "already_stopped" });
        });
    });

    describe("formatDuration()", () => {
        test("should format standard units correctly", () => {
            expect(formatDuration(Second * 5 + 500)).toBe("5s500ms");
            expect(formatDuration(Hour + Minute * 30)).toBe("1h30m");
            expect(formatDuration(0)).toBe("0ms");
        });

        test("should handle negative durations", () => {
            expect(formatDuration(-5000)).toBe("-5s");
        });

        test("should handle decimal milliseconds and precision", () => {
            expect(formatDuration(0.5)).toBe("0.5ms");
            expect(formatDuration(0.0001)).toBe("0ms"); // Below threshold
        });
    });

    describe("parseDuration()", () => {
        test("should parse human-readable strings into milliseconds", () => {
            expect(parseDuration("1h 30m")).toBe(5400000);
            expect(parseDuration("500ms")).toBe(500);
            expect(parseDuration("1.5s")).toBe(1500);
        });

        test("ExceptionMode: should throw on invalid format", () => {
            expect(() => parseDuration("invalid")).toThrow();
            expect(() => parseDuration("100xyz")).toThrow();
        });

        test("SilentMode: should return null on invalid format", () => {
            expect(parseDuration("abc", { silent: true })).toBeNull();
            expect(parseDuration("", { silent: true })).toBeNull();
        });
    });

    describe("formatDate()", () => {
        const date = new Date(2026, 0, 15, 14, 5, 9, 123); // 2026-01-15 14:05:09.123

        test("should format with various patterns", () => {
            expect(formatDate(date, "yyyy-MM-dd")).toBe("2026-01-15");
            expect(formatDate(date, "HH:mm:ss")).toBe("14:05:09");
            expect(formatDate(date, "yyyy/M/d H:m")).toBe("2026/1/15 14:5");
            expect(formatDate(date, "SSS")).toBe("123");
        });
    });

    describe("parseDate()", () => {
        test("should parse standard format correctly", () => {
            const d = parseDate("2026-01-15 14:00:00");
            expect(d.getFullYear()).toBe(2026);
            expect(d.getMonth()).toBe(0); // January is 0
            expect(d.getDate()).toBe(15);
        });

        test("should catch logical overflows (e.g., Feb 30th)", () => {
            // JS Date would normally roll Feb 30 into March, but your function should throw
            expect(() => parseDate("2026-02-30 10:00:00")).toThrow("Invalid Date Logic (Overflow)");
        });

        test("should support custom formats", () => {
            const d = parseDate("15/01/2026", { format: "dd/MM/yyyy" });
            expect(d.getFullYear()).toBe(2026);
            expect(d.getMonth()).toBe(0);
            expect(d.getDate()).toBe(15);
        });

        test("SilentMode: should return null for mismatched strings", () => {
            const result = parseDate("not-a-date", { silent: true });
            expect(result).toBeNull();
        });
    });
});