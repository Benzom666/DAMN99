/**
 * Order-number generation, shared between the admin server actions and the
 * public API order service so both mint identical, collision-safe numbers.
 */

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

/**
 * Return a unique order number given a desired value and the set already taken
 * (existing in DB + assigned so far in this batch). Free desired value -> used
 * as-is; a collision derives `BASE-2`, `BASE-3`, …, falling back to a fully
 * generated number. The chosen value is added to `taken`.
 */
export function uniqueOrderNumber(desired: string | undefined, taken: Set<string>): string {
  const base = (desired || "").trim()
  if (base && !taken.has(base)) {
    taken.add(base)
    return base
  }
  if (base) {
    for (let n = 2; n < 1000; n++) {
      const candidate = `${base}-${n}`
      if (!taken.has(candidate)) {
        taken.add(candidate)
        return candidate
      }
    }
  }
  let generated = generateOrderNumber()
  while (taken.has(generated)) generated = generateOrderNumber()
  taken.add(generated)
  return generated
}
