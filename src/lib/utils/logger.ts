type LogLevel = "info" | "warn" | "error" | "debug";

type LogMeta = Record<string, unknown> | unknown;

function serializeMeta(meta: LogMeta): string {
  if (meta === undefined) return "";
  if (meta instanceof Error) {
    return JSON.stringify({
      name: meta.name,
      message: meta.message,
      stack: process.env.NODE_ENV === "development" ? meta.stack : undefined,
    });
  }
  try {
    return JSON.stringify(
      meta,
      null,
      process.env.NODE_ENV === "development" ? 2 : 0
    );
  } catch {
    return String(meta);
  }
}

const format = (level: LogLevel, message: string, meta?: LogMeta) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    return `${base} ${serializeMeta(meta)}`;
  }
  return base;
};

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(format("info", message, meta));
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(format("warn", message, meta));
  },
  error: (message: string, meta?: LogMeta) => {
    console.error(format("error", message, meta));
  },
  debug: (message: string, meta?: LogMeta) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(format("debug", message, meta));
    }
  },
};
