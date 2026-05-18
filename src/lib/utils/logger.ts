type LogLevel = "info" | "warn" | "error" | "debug";

const format = (level: LogLevel, message: string, meta?: unknown) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    return `${base} ${JSON.stringify(meta, null, process.env.NODE_ENV === "development" ? 2 : 0)}`;
  }
  return base;
};

export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(format("info", message, meta));
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(format("warn", message, meta));
  },
  error: (message: string, meta?: unknown) => {
    console.error(format("error", message, meta));
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(format("debug", message, meta));
    }
  },
};
