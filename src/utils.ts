/**
 * Tip4Serv.js - Utility functions
 */

import type { Tip4ServError } from "./types";

export function parse_integer(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0 || !Number.isInteger(parseFloat(value))) return undefined;
  return num;
}

export function parse_float(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return undefined;
  return num;
}

export function parse_bool(value: string | null | undefined): boolean | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  return value === "true" || value === "1";
}

export function get_store_id_from_script(): number | undefined {
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[data-store-id]");
  for (let i = 0; i < scripts.length; i++) {
    const id = scripts[i].getAttribute("data-store-id");
    if (id) {
      const num = parseInt(id, 10);
      if (!isNaN(num)) return num;
    }
  }
  return undefined;
}

export function create_error(code: string, message: string): Tip4ServError {
  return { code, message };
}

export function log(message: string, type: "error" | "warn" | "info" = "info"): void {
  const prefix = "[Tip4Serv]";
  switch (type) {
    case "error":
      console.error(`${prefix} ${message}`);
      break;
    case "warn":
      console.warn(`${prefix} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}
