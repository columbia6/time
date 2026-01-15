# @own-js/time

A robust, type-safe utility library for time manipulation, duration
formatting/parsing, and date handling. Built with TypeScript and optimized for
modern environments like Bun, Node.js, and Browser.

## Features

- 🕒 **Enhanced Sleep**: Supports `AbortSignal` for graceful cancellation.
- ⏳ **Human-Readable Duration**: Convert between milliseconds and strings like
  `1d 2h 30m`.
- 📅 **Strict Date Parsing**: Format and parse dates with overflow protection
  (e.g., rejecting Feb 30th).
- 🛡️ **Type Safe**: Smart function overloads that distinguish between `silent`
  mode and exception-throwing mode.
- 🚀 **Zero Dependencies**: Lightweight and fast.

## Installation

```bash
# Using bun
bun add @own-js/time

# Using npm
npm install @own-js/time

# Using Deno
deno add npm:@own-js/time
```

## Usage

### 1. Sleep with AbortSignal

The `sleep` function supports a `silent` option. If `silent: true`, it returns
the cancellation reason instead of throwing an error.

```typescript
import { sleep } from "@own-js/time";

// Standard usage
await sleep(1000);

// With AbortSignal (Exception Mode)
const controller = new AbortController();
setTimeout(() => controller.abort("Timeout!"), 500);

try {
    await sleep(2000, { signal: controller.signal });
} catch (reason) {
    console.log(reason); // "Timeout!"
}

// With AbortSignal (Silent Mode)
const result = await sleep(2000, {
    signal: controller.signal,
    silent: true,
});
if (result?.reason) {
    console.log("Aborted because:", result.reason);
}
```

### 2. Duration Formatting & Parsing

Easily convert time units. Supports `ms`, `s`, `m`, `h`, `d`.

```typescript
import { formatDuration, Hour, Minute, parseDuration } from "@own-js/time";

// Format: ms -> String
formatDuration(Hour + (Minute * 30) + 500); // "1h30m500ms"

// Parse: String -> ms
parseDuration("1h 30m"); // 5400000

// Silent Mode: returns null instead of throwing on invalid input
const ms = parseDuration("invalid", { silent: true }); // null
```

### 3. Date Formatting & Parsing

A lightweight alternative to heavier libraries, with strict validation.

```typescript
import { formatDate, parseDate } from "@own-js/time";

const now = new Date();

// Format
formatDate(now, "yyyy-MM-dd HH:mm:ss.SSS"); // "2026-01-15 14:30:05.123"

// Parse
const date = parseDate("2026-01-15 14:00:00");

// Parse with custom format
const customDate = parseDate("15/01/2026", { format: "dd/MM/yyyy" });

// Strict validation: This throws because Feb 30th is invalid
parseDate("2026-02-30", { format: "yyyy-MM-dd" });
```

## API Reference

### Constants

- `Millisecond`: 1
- `Second`: 1,000 ms
- `Minute`: 60,000 ms
- `Hour`: 3,600,000 ms
- `Day`: 86,400,000 ms

### Functions

| Function                    | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `sleep(ms, opts?)`          | Asynchronous wait. Supports `signal` and `silent`. |
| `formatDuration(ms)`        | Formats milliseconds to human-readable string.     |
| `parseDuration(str, opts?)` | Parses duration string to milliseconds.            |
| `formatDate(date, format)`  | Formats a Date object.                             |
| `parseDate(str, opts?)`     | Parses string to Date with strict overflow check.  |

## License

[MIT](https://github.com/own-js-org/time/blob/main/LICENSE) ©
[own-js-org](https://github.com/own-js-org/time)
