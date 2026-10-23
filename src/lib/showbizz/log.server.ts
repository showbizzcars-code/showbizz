import { redactFields } from "./log.ts";

function write(level: "info" | "error", event: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...redactFields(fields),
  });
  if (level === "error") console.error(line);
  else console.info(line);
}

export function logInfo(event: string, fields: Record<string, unknown> = {}) {
  write("info", event, fields);
}

export function logError(event: string, fields: Record<string, unknown> = {}) {
  write("error", event, fields);
}
