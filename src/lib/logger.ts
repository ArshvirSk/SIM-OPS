type LogLevel = "log" | "info" | "warn" | "error" | "debug";

interface LoggerConfig {
    isDevelopment: boolean;
    minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    log: 1,
    info: 2,
    warn: 3,
    error: 4,
};

class Logger {
    private config: LoggerConfig;

    constructor(config: LoggerConfig) {
        this.config = config;
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
    }

    private formatMessage(
        level: LogLevel,
        message: string,
        data?: unknown
    ): string {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
    }

    debug(message: string, data?: unknown): void {
        if (this.config.isDevelopment && this.shouldLog("debug")) {
            console.debug(this.formatMessage("debug", message, data));
        }
    }

    log(message: string, data?: unknown): void {
        if (this.config.isDevelopment && this.shouldLog("log")) {
            console.log(this.formatMessage("log", message, data));
        }
    }

    info(message: string, data?: unknown): void {
        if (this.shouldLog("info")) {
            console.info(this.formatMessage("info", message, data));
        }
    }

    warn(message: string, data?: unknown): void {
        if (this.shouldLog("warn")) {
            console.warn(this.formatMessage("warn", message, data));
        }
    }

    error(message: string, error?: unknown): void {
        if (this.shouldLog("error")) {
            const errorData =
                error instanceof Error
                    ? { message: error.message, stack: error.stack }
                    : error;
            console.error(this.formatMessage("error", message, errorData));
        }
    }
}

// Create a singleton instance
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = new Logger({
    isDevelopment,
    minLevel: isDevelopment ? "debug" : "info",
});
