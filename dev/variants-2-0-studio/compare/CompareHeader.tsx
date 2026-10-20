import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {useState} from 'react'
import {ReleaseAvatarIcon, useClient} from 'sanity'

import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {useVariantDefinitions} from '../c1/world'
import {createVariantVersion} from '../c7/Banners'
import {useVersionList} from '../data/useVersionList'
import {sum, tally} from '../fieldmarks/markModel'
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
import {useAddressDoc, useCompareActions} from './useCompare'

// Compare C: ONE header across both panes (it sits under the navbar, in the page flow like the Showing row), as drawn on E9 413:6.
// Title by what differs (D12), Showing and Against, "N changes in M fields" (opens the change list: C5), Copy link, Close comparison.
//   C4  no version at the Against address: the fallback is shown, "Create <value>", nothing is written until the editor acts
//   C6  two dimensions differ: refused, with a one-click way back to a comparison the open beta can show

/** One-move options: the other address may differ from Showing in ONE coordinate (the layer, or the variant), never both (R2). */
export const isOneMove = (showing: Address, candidate: Address) =>
  showing.perspective === candidate.perspective || showing.variant === candidate.variant

const META = new Set(['_id', '_type', '_rev', '_createdAt', '_updatedAt', '_system'])

export function changedFields(against: unknown, showing: unknown): {name: string; count: number}[] {
  const a = (against ?? {}) as Record<string, unknown>
  const s = (showing ?? {}) as Record<string, unknown>
  return [...new Set([...Object.keys(a), ...Object.keys(s)])]
    .filter((k) => !META.has(k))
    .map((name) => ({name, count: sum(tally(a[name], s[name]))}))
    .filter((f) => f.count > 0)
}

export function CompareHeader({comparison}: {comparison: Comparison}) {
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

  const defOf = (id: string) => definitions.find((d) => d._id.replace(/^_\.variants\./, '') === id)
  const titleOf = (id: string) => (id === NONE ? 'Base' : (defOf(id)?.metadata?.title ?? id))
  const isLocale = (id: string) => id !== NONE && 'locale' in (defOf(id)?.conditions ?? {})
  const kind = compareKind(showing, against, isLocale)
  const title = compareTitle(kind, showing, against)
  const text = (a: Address) => `${layerLabel(a.perspective)} · ${titleOf(a.variant)}`

  const fields = changedFields(againstDoc.doc, showingDoc.doc)
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
        <Box flex={1} />
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
          <Card data-testid="compare-list" padding={2} style={{minWidth: 260}}>
            {fields.map((f) => (
              <Button
                key={f.name}
                data-testid={`compare-field-${f.name}`}
                mode="bleed"
                onClick={() => scrollTo(f.name)}
                padding={2}
                style={{width: '100%', justifyContent: 'space-between'}}
                text={`${f.name} · ${f.count}`}
              />
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
