import {Flex} from '@sanity/ui'
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {useMemo, useRef} from 'react'
import {type DocumentInVariantGroup, type UseVariantDetailExtension} from 'sanity'

import {useVariantDefinitions} from '../c1/world'
import {BulkActionButtons, ConfirmDialog, useBulk, versionName} from '../c5/Actionable'
import {Notice} from '../c5/ActionableLenses'
import type {Target} from '../c5/operations'
import {useCorpus} from '../c5/useCorpus'
import {useOption} from '../options/store'

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

/**
 * C6 on the SHIPPED Variants tool (core/variants/tool/detail/VariantDetail), through the PROPOSED
 * `VariantDetailExtensionProvider`: what the E5 spec says the shipped detail page lacks.
 *  - grey rows for the documents that have no version of this variant, each with Create;
 *  - the bulk bar: Publish, Unpublish, Delete, Create <variant> version, Add to release (the shared table supports a
 *    selection; the shipped page passes none);
 *  - the confirm dialog, a per-row result list and a notice above the table.
 * Only when C6 resolves to option A; otherwise the shipped page is untouched.
 */
export const useVariantDetailOverride: UseVariantDetailExtension = ({variantId}) => {
  const enabled = useOption('c6') === 'a'
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  const bulk = useBulk()
  const clearTable = useRef<() => void>(() => undefined)
  const short = variantId ? shortId(variantId) : null
  const definition = definitions.find((d) => shortId(d._id) === short)
  const title = definition?.metadata?.title ?? short ?? ''

  // Row keys are `<docId>|<bundle>` (one row per stored version) or a bare `<docId>` (an absent row).
  const targetOf = useMemo(
    () =>
      (key: string): Target | null => {
        const [docId, bundle] = key.split('|')
        const doc = corpus?.docs.find((d) => d.id === docId)
        if (!doc || !short) return null
        const all = doc.list.filter((r) => r.variantId === short)
        const rows = bundle ? all.filter((r) => r.bundle === bundle) : []
        return {docId, title: bundle ? `${doc.title} · ${versionName({bundle}, corpus!)}` : doc.title, variantId: short, rows, all}
      },
    [corpus, short],
  )

  const absentRows = useMemo(
    () =>
      !corpus || !short
        ? []
        : corpus.docs
            .filter((d) => !d.list.some((r) => r.variantId === short))
            .map(
              (d) =>
                ({
                  absent: true,
                  groupId: d.id,
                  memoKey: `absent-${d.id}-${short}`,
                  isPending: false,
                  document: {_id: d.id, _type: d.type, _rev: '', _createdAt: '', _updatedAt: d.updated, publishedDocumentExists: d.published},
                  validation: {hasError: false, isValidating: false, validation: []},
                  versions: [],
                  version: {documentId: d.id, releaseRef: null, updatedAt: d.updated},
                }) as unknown as DocumentInVariantGroup,
            ),
    [corpus, short],
  )

  if (!enabled || !corpus || !short) return undefined

  return {
    absentRows,
    perVersionRows: true,
    selection: {
      labels: {selectAll: 'Select all', selectRow: 'Select row', selectedCount: (n) => `${n} selected`, clear: 'Clear'},
      renderActions: ({selectedKeys, clear}) => {
        clearTable.current = clear
        const targets = selectedKeys.map(targetOf).filter((t): t is Target => !!t)
        return (
          <Flex data-testid="bulk-bar" gap={2} wrap="wrap">
            <BulkActionButtons onOpen={bulk.open} targets={targets} variantLabel={title} />
          </Flex>
        )
      },
    },
    rowActions: ({datum}) => {
      const row = datum as DocumentInVariantGroup
      if (!row.absent) return null
      const target = targetOf(row.rowKey ?? row.groupId)
      return target ? <Button mode="bleed" onClick={() => bulk.open('create', [target])} text="Create" /> : null
    },
    banner: (
      <>
        <Notice bulk={bulk} />
        <ConfirmDialog address={title} bulk={bulk} corpus={corpus} definitions={definitions} onDone={() => clearTable.current()} />
      </>
    ),
  }
}
