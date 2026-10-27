import {useToast} from '@sanity/ui/toast'
import {useCallback, useState} from 'react'
import {getTargetDocument, useClient, useDocumentVersions} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

/** A row of the inventory: the bundle it is in (`published`, `drafts` or a release id) and its variant's short id (none for the base). */
export interface DiscardTarget {
  group: string
  variantId: string | undefined
}

/**
 * Deletes versions of the open document, as core's Discard version does: one `sanity.action.document.version.discard` per version, sent
 * together. A draft or a release version can be discarded; a published version cannot (that is an unpublish), so it is left out and counted
 * in `skipped`. The version list is live, so the deleted rows leave the inventory by themselves (27 Oct, Faheem: the inventory's Delete deleted
 * nothing).
 */
export function useDiscardVersions() {
  const {documentId} = useDocumentPane()
  const {versions} = useDocumentVersions({documentId})
  const client = useClient({apiVersion: '2025-02-19'})
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)

  /** The stored version ids the targets stand for, and how many targets cannot be deleted here (Published, or not found). */
  const resolve = useCallback(
    (targets: readonly DiscardTarget[]) => {
      const ids: string[] = []
      let skipped = 0
      for (const target of targets) {
        const stub =
          target.group === 'published'
            ? undefined
            : getTargetDocument({
                bundle: target.group as never,
                variant: target.variantId ? `_.variants.${target.variantId}` : undefined,
                documentVersions: versions,
              })
        if (stub) ids.push(stub._id)
        else skipped += 1
      }
      return {ids, skipped}
    },
    [versions],
  )

  /** Discards the targets' versions. Resolves `true` when every one was deleted (or there was nothing to delete). */
  const discard = useCallback(
    async (targets: readonly DiscardTarget[]) => {
      const {ids} = resolve(targets)
      if (!ids.length) return true
      setDeleting(true)
      try {
        await client.action(
          ids.map((versionId) => ({
            actionType: 'sanity.action.document.version.discard',
            versionId,
          })),
          {tag: 'variants-handoff.inventory-delete'},
        )
        setDeleting(false)
        return true
      } catch (error) {
        setDeleting(false)
        toast.push({
          status: 'error',
          title: ids.length === 1 ? 'The version was not deleted' : 'The versions were not deleted',
          description: error instanceof Error ? error.message : undefined,
        })
        return false
      }
    },
    [client, resolve, toast],
  )

  return {deleting, discard, resolve}
}
