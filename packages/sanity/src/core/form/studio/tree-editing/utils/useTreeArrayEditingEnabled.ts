import {useSource} from 'sanity'

/**
 * A utility hook to check if the tree array editing dialog should be open (based on config)
 * @returns Returns true if the dialog should be open
 * @internal
 */
export function useTreeArrayEditingEnabled(): boolean {
  const {features} = useSource()

  // it either has the value of the `enabled` property or defaults to `true`
  return features?.beta?.treeArrayEditing?.enabled ?? false
}
