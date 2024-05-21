import {useSource} from 'sanity'

/**
 * A utility hook to check if the array editing dialog should be open (based on config)
 * @returns Returns true if the dialog should be open
 * @internal
 */
export function useLegacyArrayEditingConfig(): boolean {
  const {document} = useSource()

  // it either has the value of the `enabled` property or defaults to `true`
  return document.unstable_legacyArrayEditing?.enabled ?? true
}
