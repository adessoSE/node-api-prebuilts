import { getSystemErrorMap } from "node:util";

// supplement @types/node with the napi version property
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessVersions {
      napi: string;
    }
  }
}

export function isNonNullObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val != null;
}
export function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.length > 0;
}

export function isErrnoException(exc: unknown): exc is NodeJS.ErrnoException {
  if (typeof exc !== "object" || !(exc instanceof Error) || !("errno" in exc)) {
    return false;
  }
  const errno = exc.errno;
  return typeof errno === "number" && getSystemErrorMap().has(errno);
}

export class CommandError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(
      isErrnoException(cause)
        ? `${message}\n${cause.message}`
        : cause instanceof Error
          ? `${message}\ncause: ${cause.message}`
          : message,
    );
    if (cause instanceof Error && isNonEmptyString(cause.stack)) {
      this.stack = cause.stack;
    }
  }
}
