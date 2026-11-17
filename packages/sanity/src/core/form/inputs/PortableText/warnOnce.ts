const seenMessages = new Set<string>()

/**
 * Schema-less values warn once per distinct message, and the messages carry
 * the value's path, so every affected location reports exactly once. The
 * affordance in the editor carries the author-facing signal; the console
 * line is a developer breadcrumb, and repeating it per render would drown
 * real warnings.
 */
export function warnOnce(message: string): void {
  if (seenMessages.has(message)) {
    return
  }
  seenMessages.add(message)
  console.warn(message)
}
