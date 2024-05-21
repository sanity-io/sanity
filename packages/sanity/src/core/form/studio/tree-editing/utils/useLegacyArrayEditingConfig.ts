import {useSource} from 'sanity'

export function useLegacyArrayEditingConfig(): boolean {
  const {document} = useSource()
  return document.unstable_legacyArrayEditing.enabled
}
