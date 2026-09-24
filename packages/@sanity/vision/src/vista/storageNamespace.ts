/**
 * The `localStorage` namespace of the redesigned tool. Kept in its own module so the classic
 * tool's error boundary can clear it without pulling the redesign's code into its bundle.
 */
export const VISTA_STORAGE_KEY_PREFIX = 'sanityVista:'

export function getVistaStorage(): Storage | undefined {
  try {
    const storage = globalThis.localStorage
    const probe = `${VISTA_STORAGE_KEY_PREFIX}probe`
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return storage
  } catch {
    return undefined
  }
}

/** Removes every project's persisted state, for the error boundary's "clear cache" recovery */
export function clearAllVistaState(): void {
  const storage = getVistaStorage()
  if (!storage) {
    return
  }
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(VISTA_STORAGE_KEY_PREFIX)) {
      keys.push(key)
    }
  }
  keys.forEach((key) => storage.removeItem(key))
}
