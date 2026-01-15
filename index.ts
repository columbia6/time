export const Millisecond = 1
export const Second = Millisecond * 1000
export const Minute = Second * 60
export const Hour = Minute * 60
export const Day = Hour * 24
export interface SilentOptions {
    /**
     * When an error occurs, if this option is true, the current function should return the error; otherwise, it should throw an exception.
     */
    silent?: boolean
}
export type SilentMode = { silent: true }
export type ExceptionMode = { silent?: false | undefined }
export interface SleepOptions<T> extends SilentOptions {
    /**
     * The sleep function can be gracefully stopped at any time using a signal
     */
    signal?: AbortSignal
}
/**
 * The `sleep` function, if stopped by a signal in silent mode, will immediately return this type.
 */
export interface SleepAborted<T> {
    reason: T
}
/**
 * Supports AbortSignal sleep
 */
export function sleep<T>(ms: number, opts: SleepOptions<T> & SilentMode): Promise<SleepAborted<T> | null>

/**
 * Supports AbortSignal sleep
 */
export function sleep<T>(ms: number, opts?: SleepOptions<T> & ExceptionMode): Promise<null>

export function sleep<T>(ms: number, opts?: SleepOptions<T>) {
    const { signal, silent } = opts || {}
    if (signal?.aborted) {
        return silent ? Promise.resolve({ reason: signal.reason }) : Promise.reject(signal.reason)
    }
    if (ms <= 0) {
        return Promise.resolve(null)
    }
    return new Promise<SleepAborted<T> | null>((resolve, reject) => {
        const cleanup = (aborted?: boolean) => {
            if (aborted) {
                clearTimeout(timer)
            } else {
                signal?.removeEventListener('abort', onAbort)
            }
        }
        const onAbort = () => {
            cleanup(true)
            silent ? resolve({ reason: signal?.reason }) : reject(signal?.reason)
        }
        const timer = setTimeout(() => {
            cleanup()
            resolve(null)
        }, ms)

        signal?.addEventListener('abort', onAbort, { once: true })
    })
}

/**
* Converts milliseconds to a human-friendly string (supports decimals)
*/
export function formatDuration(ms: number): string {
    if (ms < 0) {
        return `-${formatDuration(Math.abs(ms))}`
    }
    if (ms === 0) {
        return "0ms"
    }
    if (ms < 0.001) {
        return "0ms"
    }

    const units = [
        { label: "d", value: Day },
        { label: "h", value: Hour },
        { label: "m", value: Minute },
        { label: "s", value: Second },
    ]

    const result: string[] = []
    let remaining = ms + 0.0000001

    for (const { label, value } of units) {
        if (remaining >= value) {
            const count = Math.floor(remaining / value)
            remaining %= value
            result.push(`${count}${label}`)
        }
    }

    if (remaining >= 1) {
        const msValue = parseFloat((remaining - 0.0000001).toFixed(3))
        if (msValue > 0) result.push(`${msValue}ms`)
    } else if (remaining > 0.0000001) {
        const msValue = parseFloat((remaining - 0.0000001).toFixed(3))
        if (msValue > 0) result.push(`${msValue}ms`)
    }

    return result.length === 0 ? "0ms" : result.join("")
}

export interface ParseDurationOptions extends SilentOptions { }

/**
 * Convert a human-readable string to milliseconds.
 */
export function parseDuration(s: string, opts: ParseDurationOptions & SilentMode): number | null
/**
 * Convert a human-readable string to milliseconds.
 */
export function parseDuration(s: string, opts?: ParseDurationOptions & ExceptionMode): number

export function parseDuration(s: string, opts?: ParseDurationOptions): number | null {
    const silent = opts?.silent
    const normalized = s.trim().replace(/\s/g, '')
    if (!normalized) {
        if (silent) {
            return null
        }
        throw new Error(`Invalid duration: "${s}"`)
    }

    const durationRegex = /(-?\d*\.?\d+)(ms|s|m|h|d)/gi
    const unitMap: Record<string, number> = { ms: Millisecond, s: Second, m: Minute, h: Hour, d: Day }

    let totalMs = 0
    let matchCount = 0
    let lastIndex = 0

    let match: RegExpExecArray | null
    durationRegex.lastIndex = 0

    while ((match = durationRegex.exec(normalized)) !== null) {
        const value = parseFloat(match[1]!)
        const unit = match[2]!.toLowerCase()

        totalMs += value * unitMap[unit]!
        matchCount++
        lastIndex = durationRegex.lastIndex
    }

    if (matchCount === 0 || lastIndex !== normalized.length) {
        if (silent) {
            return null
        }
        throw new Error(`Invalid duration format: "${s}"`)
    }
    return totalMs
}
/**
 * Format a date object as a string.
 */
export function formatDate(date: Date, format: string): string {
    const o: Record<string, number> = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "H+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
    };

    if (/(y+)/.test(format)) {
        format = format.replace(
            RegExp.$1,
            (date.getFullYear() + "").slice(4 - RegExp.$1.length)
        );
    }

    if (/(S+)/.test(format)) {
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        format = format.replace(RegExp.$1, ms.slice(0, RegExp.$1.length));
    }

    for (const k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            const value = o[k];
            const replacement = RegExp.$1.length === 1
                ? value!.toString()
                : value!.toString().padStart(RegExp.$1.length, '0');
            format = format.replace(RegExp.$1, replacement);
        }
    }

    return format;
}

export interface ParseDateOptions extends SilentOptions {
    /**
     * @default 'yyyy-MM-dd HH:mm:ss'
     */
    format?: string
}
/**
 * Parse the string into a Date object according to the specified format.
 */
export function parseDate(s: string, opts: ParseDateOptions & SilentMode): Date | null
/**
 * Parse the string into a Date object according to the specified format.
 */
export function parseDate(s: string, opts?: ParseDateOptions & ExceptionMode): Date

export function parseDate(s: string, opts?: ParseDateOptions): Date | null {
    const format = opts?.format ?? 'yyyy-MM-dd HH:mm:ss'
    const silent = opts?.silent
    try {
        const mapping: Record<string, { key: string; len: number }> = {
            yyyy: { key: 'year', len: 4 },
            MM: { key: 'month', len: 2 },
            dd: { key: 'day', len: 2 },
            HH: { key: 'hour', len: 2 },
            mm: { key: 'minute', len: 2 },
            ss: { key: 'second', len: 2 },
            SSS: { key: 'ms', len: 3 },
        };

        const groups: string[] = [];
        const pattern = format
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/yyyy|MM|dd|HH|mm|ss|SSS/g, (match) => {
                groups.push(match);
                const len = mapping[match]!.len;
                return `(\\d{1,${len}})`;
            });

        const regex = new RegExp(`^${pattern}$`);
        const match = s.match(regex);

        if (!match) throw new Error(`String "${s}" does not match format "${format}"`);

        const values: Record<string, number> = {
            year: 0, month: 1, day: 1, hour: 0, minute: 0, second: 0, ms: 0
        };

        groups.forEach((group, i) => {
            const val = parseInt(match[i + 1]!, 10);
            const type = mapping[group]!.key;
            values[type] = type === 'month' ? val - 1 : val;
        });

        const date = new Date(
            values.year!, values.month!, values.day,
            values.hour, values.minute, values.second, values.ms
        );

        if (isNaN(date.getTime()) ||
            date.getFullYear() !== values.year ||
            date.getMonth() !== values.month ||
            date.getDate() !== values.day
        ) {
            throw new Error('Invalid Date Logic (Overflow)');
        }

        return date
    } catch (e) {
        if (silent) return null
        throw e
    }
}
