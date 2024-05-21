import {useSource} from 'sanity'

export function useLegacyArrayEditingConfig(): boolean {
  const {document} = useSource()

  // it either has the value of the `enabled` property or defaults to `true`
  return document.unstable_legacyArrayEditing?.enabled ?? true
}
