import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useState} from 'react'
import {ReleaseAvatarIcon, useClient, useSetVariant} from 'sanity'

import {buildConditionFacets} from '../../../packages/sanity/src/core/variants/tool/util'
import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {useVariantDefinitions} from '../c1/world'
import {createVariantVersion} from '../c7/Banners'
import {useVersionList} from '../data/useVersionList'
import {type Change, flatten, type Json, pathToString} from '../fieldmarks/markModel'
import {PassControls} from '../list/ListParts'
import {layerLabel, Pick} from '../pane/PaneAddress'
import {useResultToast} from '../toasts/ResultToast'
import {
  type Address,
  compareKind,
  compareTitle,
  type Comparison,
  NONE,
  sameAddress,
  setAgainstPath,
} from './address'
import {ComposedCompareBar} from './composed/ComposedCompareBar'
import {addressOfSide, sideOfAddress, type BundleOption} from './composed/composedModel'
import {useAddressDoc, useCompareActions} from './useCompare'

// Compare C: ONE header across both panes (it sits under the navbar, in the page flow like the Showing row), as drawn on E9 413:6.
// Title by what differs (D12), Showing and Against, "N changes in M fields" (opens the change list: C5), Copy link, Close comparison.
//   C4  no version at the Against address: the fallback is shown, "Create <value>", nothing is written until the editor acts
//   C6  two dimensions differ: refused, with a one-click way back to a comparison the open beta can show

/** One-move options: the other address may differ from Showing in ONE coordinate (the layer, or the variant), never both (R2). */
export const isOneMove = (showing: Address, candidate: Address) =>
  showing.perspective === candidate.perspective || showing.variant === candidate.variant

const META = new Set(['_id', '_type', '_rev', '_createdAt', '_updatedAt', '_system'])

/** The changed top-level fields with how many changes each holds: the Review changes panel's entries, grouped by field (one count everywhere). */
export function changedFields(against: unknown, showing: unknown): {name: string; count: number}[] {
  const counts = new Map<string, number>()
  for (const change of flatten(against, showing)) {
    const name = typeof change.path[0] === 'string' ? change.path[0] : 'document'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts].map(([name, count]) => ({name, count}))
}

/** The bar's rung (how far the chips have collapsed) is shared by every bar on the page (compare E), so dimensions line up across panes. */
export type ComposedLook = 'd' | 'e' | 'f'

export function CompareHeader({
  comparison,
  composed,
}: {
  comparison: Comparison
  composed?: ComposedLook
}) {
  const {docId, showing, against} = comparison
  const actions = useCompareActions()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(docId)
  const client = useClient({apiVersion: 'X'})
  const showToast = useResultToast()
  const showingDoc = useAddressDoc(docId, showing)
  const againstDoc = useAddressDoc(docId, against)
  const [listOpen, setListOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [refusal, setRefusal] = useState<string | null>(null)
  const setVariant = useSetVariant()

  const defOf = (id: string) => definitions.find((d) => d._id.replace(/^_\.variants\./, '') === id)
  const titleOf = (id: string) => (id === NONE ? 'Base' : (defOf(id)?.metadata?.title ?? id))
  const isLocale = (id: string) => id !== NONE && 'locale' in (defOf(id)?.conditions ?? {})
  const kind = compareKind(showing, against, isLocale)
  const title = compareTitle(kind, showing, against)
  const text = (a: Address) => `${layerLabel(a.perspective)} · ${titleOf(a.variant)}`

  const fields = changedFields(againstDoc.doc, showingDoc.doc)
  const changes = flatten(againstDoc.doc, showingDoc.doc)
  const toast = useToast()
  const total = fields.reduce((n, f) => n + f.count, 0)
  const missing = againstDoc.ready && !againstDoc.doc
  const variantIds = [
    ...new Set((versions ?? []).map((v) => v.variantId).filter((v): v is string => !!v)),
  ]

  const options: {key: string; address: Address}[] = []
  for (const perspective of ['published', 'drafts'])
    for (const variant of [NONE, ...variantIds])
      options.push({key: `${perspective}|${variant}`, address: {perspective, variant}})

  const wayBack: Address = {perspective: showing.perspective, variant: against.variant}
  const create = async () => {
    if (against.variant === NONE) return
    setCreating(true)
    const failure = await createVariantVersion(
      client.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
      {
        documentId: docId,
        variantId: against.variant,
        bundleId: against.perspective === 'published' ? 'drafts' : against.perspective,
      },
    )
    setCreating(false)
    if (failure)
      showToast('failed', {variant: titleOf(against.variant), verb: 'create', detail: failure})
    else {
      window.dispatchEvent(new Event('focus'))
      showToast('version-created', {variant: titleOf(against.variant), document: 'This document'})
    }
  }
  const copy = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  }
  // Revert one change on the Showing side (the editable draft), straight on the document: the header sits outside the pane's form. The pane, the marks and
  // the counts follow when the document changes; Undo puts the top-level field back as it was.
  const revert = async (change: Change) => {
    const doc = showingDoc.doc as {_id?: string} & Record<string, Json>
    if (!doc?._id) return
    const top = typeof change.path[0] === 'string' ? change.path[0] : undefined
    const was = top ? (doc as Record<string, Json>)[top] : undefined
    const target = client
      .withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false})
      .patch(doc._id)
    const at = pathToString(change.path)
    const op = change.revert
    if (op.op === 'set') {
      if (op.value === undefined) target.unset([pathToString(op.path)])
      else target.set({[pathToString(op.path)]: op.value as never})
    } else if (op.op === 'unset') target.unset([at])
    else {
      const arr = pathToString(op.path)
      target.insert(
        op.at > 0 ? 'after' : 'before',
        op.at > 0 ? `${arr}[${op.at - 1}]` : `${arr}[0]`,
        [op.item as never],
      )
    }
    await target.commit()
    window.dispatchEvent(new Event('focus'))
    toast.push({
      id: 'e9-revert',
      status: 'success',
      title: `Reverted ${change.label}`,
      description: (
        <Button
          data-testid="undo-revert"
          fontSize={1}
          mode="ghost"
          onClick={() => {
            if (!top) return
            const back = client
              .withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false})
              .patch(doc._id as string)
            void (was === undefined ? back.unset([top]) : back.set({[top]: was as never})).commit()
          }}
          padding={2}
          text="Undo"
        />
      ),
      duration: 8000,
    })
  }
  const scrollTo = (name: string) => {
    setListOpen(false)
    document
      .querySelector(`[data-testid="document-pane"] [data-testid="field-${name}"]`)
      ?.scrollIntoView({block: 'center', behavior: 'smooth'})
  }

  return (
    <Card
      data-testid="compare-header"
      data-kind={kind}
      paddingX={3}
      paddingY={2}
      style={{borderBottom: '1px solid var(--card-border-color)'}}
      tone="transparent"
    >
      <Flex align="center" gap={3} wrap="wrap">
        <Text data-testid="compare-title" size={1} weight="semibold">
          {title}
        </Text>
        {composed ? (
          <ComposedBar
            comparison={comparison}
            definitions={definitions}
            look={composed}
            onRefuse={setRefusal}
            releases={(versions ?? [])
              .filter((v) => v.release && v.bundleId && !v.variantId)
              .map((v) => ({id: v.bundleId as string, label: v.release as string}))}
            setVariant={setVariant}
          />
        ) : (
          <Flex align="center" gap={2}>
            <Text muted size={1}>
              Showing
            </Text>
            <span data-testid="compare-showing" style={chipStyle}>
              <ReleaseAvatarIcon
                release={showing.perspective === 'published' ? 'published' : 'drafts'}
              />{' '}
              {text(showing)}
            </span>
            <Text muted size={1}>
              Against
            </Text>
            <Pick
              items={options.map(({key, address}) => {
                const allowed = isOneMove(showing, address)
                return {
                  key,
                  text: allowed
                    ? text(address)
                    : `${text(address)} · Open beta compares one dimension at a time`,
                  selected: sameAddress(address, against),
                  disabled: !allowed,
                  onClick: () => actions.go(setAgainstPath(comparison, address)),
                }
              })}
              testId="compare-against"
              text={text(against)}
            />
          </Flex>
        )}
        <Box flex={1} />
        {/* A review pass held in the list shows here too, because the list pane folds away when two panes are open. */}
        {refusal ? (
          <Text data-testid="compare-refusal" size={1}>
            {refusal}
          </Text>
        ) : null}
        <PassControls />
        {kind === 'refused' ? (
          <Flex align="center" gap={2} data-testid="compare-refused">
            <Text size={1}>Open beta compares one dimension at a time.</Text>
            <Button
              data-testid="compare-way-back"
              fontSize={1}
              mode="ghost"
              onClick={() => actions.go(setAgainstPath(comparison, wayBack))}
              padding={2}
              text={`Compare ${titleOf(against.variant)} at ${layerLabel(showing.perspective)}`}
              tone="primary"
            />
          </Flex>
        ) : missing ? (
          <Flex align="center" gap={2} data-testid="compare-missing">
            <Text size={1}>No version at this address: showing what it inherits.</Text>
            {against.variant !== NONE ? (
              <Button
                data-testid="compare-create"
                disabled={creating}
                fontSize={1}
                mode="ghost"
                onClick={() => void create()}
                padding={2}
                text={`Create ${titleOf(against.variant)}`}
                tone="primary"
              />
            ) : null}
          </Flex>
        ) : (
          <span ref={setAnchor} style={{display: 'inline-flex'}}>
            <Button
              data-testid="compare-count"
              disabled={!showingDoc.ready || !againstDoc.ready}
              fontSize={1}
              mode="bleed"
              onClick={() => setListOpen((o) => !o)}
              padding={2}
              text={
                total === 0
                  ? 'No changes'
                  : `${total} ${total === 1 ? 'change' : 'changes'} in ${fields.length} ${fields.length === 1 ? 'field' : 'fields'}`
              }
            />
          </span>
        )}
        <Button
          data-testid="compare-copy"
          fontSize={1}
          mode="bleed"
          onClick={copy}
          padding={2}
          text={copied ? 'Link copied' : 'Copy link'}
        />
        <Button
          data-testid="compare-close"
          fontSize={1}
          mode="ghost"
          onClick={actions.close}
          padding={2}
          text="Close comparison"
        />
      </Flex>
      <Popover
        content={
          <Card data-testid="compare-list" padding={2} style={{minWidth: 340}}>
            {changes.map((change) => (
              <Flex align="center" gap={2} key={change.key} paddingY={1}>
                <Box flex={1}>
                  <Button
                    data-testid={`compare-field-${typeof change.path[0] === 'string' ? change.path[0] : 'document'}`}
                    mode="bleed"
                    onClick={() =>
                      scrollTo(typeof change.path[0] === 'string' ? change.path[0] : '')
                    }
                    padding={2}
                    style={{width: '100%', justifyContent: 'flex-start'}}
                    text={`${change.label} · ${change.kind}`}
                  />
                </Box>
                <Button
                  data-testid="compare-revert"
                  disabled={showing.perspective === 'published'}
                  fontSize={1}
                  mode="ghost"
                  onClick={() => void revert(change)}
                  padding={2}
                  text="Revert"
                  title={
                    showing.perspective === 'published'
                      ? 'Open the Draft to revert: this version is read-only'
                      : undefined
                  }
                />
              </Flex>
            ))}
          </Card>
        }
        open={listOpen && fields.length > 0}
        padding={0}
        placement="bottom-start"
        portal
        referenceElement={anchor}
      />
    </Card>
  )
}

const chipStyle = {
  alignItems: 'center',
  background: 'var(--card-badge-default-bg-color)',
  borderRadius: 999,
  display: 'inline-flex',
  fontSize: 13,
  gap: 4,
  padding: '3px 10px',
} as const

/** Compare D, E and F: the Storybook ComposedAddressBar (compare/composed) in the header. The anchor is the global perspective, the counterpart is the Against pane. */
function ComposedBar(props: {
  comparison: Comparison
  definitions: ReturnType<typeof useVariantDefinitions>
  look: ComposedLook
  releases: BundleOption[]
  onRefuse: (reason: string | null) => void
  setVariant: ReturnType<typeof useSetVariant>
}) {
  const {comparison, definitions, look, releases, onRefuse, setVariant} = props
  const actions = useCompareActions()
  const bundles: BundleOption[] = [
    {id: 'drafts', label: 'Draft'},
    {id: 'published', label: 'Published'},
    ...releases,
  ]
  const facets = buildConditionFacets(definitions as never)
  const anchor = sideOfAddress(
    {
      perspective: comparison.showing.perspective,
      variant: comparison.showing.variant === NONE ? 'none' : comparison.showing.variant,
    },
    definitions,
  )
  const counterpart = sideOfAddress(comparison.against, definitions)
  return (
    <ComposedCompareBar
      anchor={anchor}
      bundles={bundles}
      clearable={false}
      comparable
      counterpart={counterpart}
      facets={facets}
      instanceId={`compare-${look}`}
      layout={look === 'f' ? 'inline' : 'tiers'}
      maxCompared={1}
      onAnchorChange={(side) => {
        // Showing is the global perspective: moving it moves the whole studio (the Against pane keeps its own address).
        const next = addressOfSide(side, definitions)
        const definition = definitions.find(
          (d) => d._id.replace(/^_\.variants\./, '') === next.variant,
        )
        setVariant({variantId: definition?._id as never, perspective: next.perspective as never})
        onRefuse(null)
      }}
      onCounterpartChange={(side) => {
        if (!side) return actions.close()
        const next = addressOfSide(side, definitions)
        if (next.variant === null) return onRefuse('No single variant matches these values.')
        onRefuse(null)
        actions.go(
          setAgainstPath(comparison, {perspective: next.perspective, variant: next.variant}),
        )
      }}
      onRefuse={onRefuse}
      reserveSecondRow={look === 'd'}
      variants={definitions}
    />
  )
}
