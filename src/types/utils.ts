/**
 * Utility Type Guards and Helpers
 * Provides type-safe utilities for runtime type checking
 */

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is Function {
  return typeof value === "function";
}

// Safe property access with type narrowing
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

// Safe property access with type and value validation
export function hasStringProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, string> {
  return hasProperty(obj, key) && isString(obj[key]);
}

export function hasNumberProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, number> {
  return hasProperty(obj, key) && isNumber(obj[key]);
}

export function hasBooleanProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, boolean> {
  return hasProperty(obj, key) && isBoolean(obj[key]);
}

export function hasObjectProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, Record<string, unknown>> {
  return hasProperty(obj, key) && isObject(obj[key]);
}

export function hasArrayProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown[]> {
  return hasProperty(obj, key) && isArray(obj[key]);
}

// Safe array access with type narrowing
export function safeArrayAccess<T>(
  arr: T[] | undefined | null,
  index: number
): T | undefined {
  if (!arr || index < 0 || index >= arr.length) {
    return undefined;
  }
  return arr[index];
}

// Safe array first element
export function firstElement<T>(arr: T[] | undefined | null): T | undefined {
  return safeArrayAccess(arr, 0);
}

// Safe array last element
export function lastElement<T>(arr: T[] | undefined | null): T | undefined {
  if (!arr || arr.length === 0) {
    return undefined;
  }
  return arr[arr.length - 1];
}

// Safe object property access
export function safeGet<T>(
  obj: Record<string, T> | undefined | null,
  key: string
): T | undefined {
  if (!obj) {
    return undefined;
  }
  return obj[key];
}

// Type-safe filter for defined values
export function filterDefined<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isDefined);
}

// Type-safe map with defined values only
export function mapDefined<T, U>(
  arr: (T | null | undefined)[],
  fn: (value: T) => U
): U[] {
  return filterDefined(arr).map(fn);
}

// Assert value is defined (throws if not)
export function assertDefined<T>(
  value: T | null | undefined,
  message = "Value is null or undefined"
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message);
  }
}

// Assert value is string (throws if not)
export function assertString(
  value: unknown,
  message = "Value is not a string"
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message);
  }
}

// Assert value is number (throws if not)
export function assertNumber(
  value: unknown,
  message = "Value is not a number"
): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message);
  }
}

// Assert value is object (throws if not)
export function assertObject(
  value: unknown,
  message = "Value is not an object"
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(message);
  }
}

// Assert value is array (throws if not)
export function assertArray(
  value: unknown,
  message = "Value is not an array"
): asserts value is unknown[] {
  if (!isArray(value)) {
    throw new Error(message);
  }
}

// Ensure value with default
export function withDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return isDefined(value) ? value : defaultValue;
}

// Parse JSON safely
export function parseJSON<T = unknown>(
  json: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}
