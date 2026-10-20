import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode, useEffect, useState} from 'react'
import {useRouter} from 'sanity/router'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {type Address, NONE} from '../compare/address'
import {useGlobalAddress} from '../compare/useCompare'
import {type AudienceVersion} from '../data/versions'
import {useOption} from '../design-options/store'
import {endPass, nextInPass, startPass, useDiffMap, useLooked, usePass} from './listStore'
import {comparisonPath, docIdFromHref, openDocBesidePath} from './navigation'

// E9 list parts. `listMark` (B, C) styles the "Has variant" side; `listFlyout` (B, C) adds a chevron flyout of versions with "Open beside" and
// Cmd-click; `reviewPass` (B, C) adds a Differs word per row, a header count with "Review <variant>" and, in C, a pass held in the list.

const PURPLE = 'var(--card-badge-suggest-dot-color)'
const PURPLE_FG = 'var(--card-badge-suggest-fg-color)'

/** Navigation that keeps the query string (the global perspective, the design options). */
function useGo() {
  const router = useRouter()
  return (path: string) => router.navigateUrl({path: path + window.location.search})
}

export const addressOf = (v: AudienceVersion): Address => ({
  perspective: v.bundleId ?? (v.state === 'published' ? 'published' : 'drafts'),
  variant: v.variantId ?? NONE,
})

// ---- The header of the list (reviewPass) -------------------------------------------------------------------------------

export function ReviewHeader(props: {
  type: string
  variantId: string
  title: string
  orderedIds: string[]
}) {
  const {type, variantId, title, orderedIds} = props
  const option = useOption('reviewPass')
  const map = useDiffMap(type, variantId)
  const pass = usePass()
  const global = useGlobalAddress()
  const go = useGo()
  const total = orderedIds.filter((id) => map?.has(id)).length
  const differing = orderedIds.filter((id) => map?.get(id)?.differs)
  const against: Address = {perspective: global.perspective, variant: NONE}
  const open = (id: string) => go(comparisonPath(type, id, against))

  const inPass = option === 'c' && pass.active && pass.variantId === variantId
  return (
    <Box
      data-testid="review-header"
      paddingX={3}
      paddingY={2}
      style={{borderBottom: '1px solid var(--card-border-color)'}}
    >
      <Stack gap={2}>
        {inPass ? null : (
          <Text data-testid="review-summary" size={1}>
            {title} against Base · {map ? `${differing.length} of ${total} differ` : 'counting…'}
          </Text>
        )}
        {inPass ? (
          <PassControls />
        ) : (
          <Button
            data-testid="review-start"
            disabled={!map || differing.length === 0}
            fontSize={1}
            mode="ghost"
            onClick={() => {
              if (option === 'c') startPass(type, variantId, differing)
              open(differing[0])
            }}
            padding={2}
            text={`Review ${title}`}
            tone="primary"
          />
        )}
      </Stack>
    </Box>
  )
}

/** The held pass: where it is, Next changed document, End review. In the list header, and in the compare header while the list pane is folded away. */
export function PassControls() {
  const pass = usePass()
  const global = useGlobalAddress()
  const go = useGo()
  // Esc ends the pass.
  useEffect(() => {
    if (!pass.active) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') endPass()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pass.active])
  if (!pass.active) return null
  const open = (id: string) =>
    go(comparisonPath(pass.type, id, {perspective: global.perspective, variant: NONE}))
  return (
    <Flex align="center" data-testid="pass-controls" gap={2}>
      <Text data-testid="review-pass-position" size={1} weight="semibold">
        Document {pass.index + 1} of {pass.ids.length} that differ
      </Text>
      <Button
        data-testid="review-next"
        fontSize={1}
        mode="default"
        onClick={() => {
          const next = pass.ids[(pass.index + 1) % pass.ids.length]
          nextInPass()
          open(next)
        }}
        padding={2}
        text="Next changed document"
        tone="primary"
      />
      <Button
        data-testid="review-end"
        fontSize={1}
        mode="ghost"
        onClick={endPass}
        padding={2}
        text="End review"
      />
    </Flex>
  )
}

// ---- Row extras ---------------------------------------------------------------------------------------------------------

/** The Differs word, the Looked at tag and the flyout chevron of one row. `null` when no E9 list option is on. */
export function RowExtras(props: {
  documentId: string
  documentType: string
  versions: AudienceVersion[]
  variantId: string | null
}): ReactNode {
  const {documentId, documentType, versions, variantId} = props
  const reviewPass = useOption('reviewPass')
  const flyout = useOption('listFlyout')
  const map = useDiffMap(reviewPass !== 'a' ? documentType : undefined, variantId)
  const looked = useLooked()
  const differs = reviewPass !== 'a' && !!map?.get(documentId)?.differs
  const seen = reviewPass === 'c' && looked.has(documentId)
  if (!differs && !seen && flyout === 'a') return null
  return (
    <span style={{alignItems: 'center', display: 'inline-flex', gap: 6}}>
      {differs ? (
        <span data-testid="row-differs" style={{color: PURPLE_FG, fontSize: 12, fontWeight: 600}}>
          Differs
        </span>
      ) : null}
      {seen ? (
        <span data-testid="row-looked" style={{color: 'var(--card-muted-fg-color)', fontSize: 12}}>
          Looked at
        </span>
      ) : null}
      {flyout !== 'a' ? (
        <RowFlyout documentId={documentId} documentType={documentType} versions={versions} />
      ) : null}
    </span>
  )
}

function RowFlyout(props: {documentId: string; documentType: string; versions: AudienceVersion[]}) {
  const {documentId, documentType, versions} = props
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const go = useGo()
  // The popover's content is portalled, but React events still bubble to the row's link: stop them there, and close on an outside click.
  useEffect(() => {
    if (!open) return undefined
    const close = (event: MouseEvent) => {
      if (
        !(event.target as HTMLElement | null)?.closest(
          '[data-testid="row-flyout-content"], [data-testid="row-flyout"]',
        )
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const label = (v: AudienceVersion) =>
    `${v.audience ?? 'Base'} · ${v.state === 'published' ? 'Published' : v.state === 'draft' ? 'Draft' : (v.release ?? v.state)}`
  return (
    <>
      <span ref={setAnchor} style={{display: 'inline-flex'}}>
        <button
          aria-expanded={open}
          aria-label="Versions"
          data-testid="row-flyout"
          onClick={(event) => {
            // Inside a link: the chevron opens the flyout and does not open the document.
            event.preventDefault()
            event.stopPropagation()
            setOpen((o) => !o)
          }}
          style={{
            alignItems: 'center',
            background: 'none',
            border: 0,
            borderRadius: 4,
            color: 'inherit',
            cursor: 'pointer',
            display: 'inline-flex',
            height: 24,
            justifyContent: 'center',
            padding: 0,
            width: 24,
          }}
          type="button"
        >
          <ChevronRightIcon style={{fontSize: 18, transform: open ? 'rotate(90deg)' : undefined}} />
        </button>
      </span>
      <Popover
        content={
          open ? (
            <Card
              data-testid="row-flyout-content"
              onClick={(event) => event.stopPropagation()}
              padding={2}
              style={{minWidth: 280}}
            >
              <Stack gap={1}>
                <Box paddingX={2} paddingY={1}>
                  <Text muted size={0}>
                    Versions
                  </Text>
                </Box>
                {versions.map((v, i) => (
                  <Flex
                    align="center"
                    gap={2}
                    key={`${v.variantId}-${v.bundleId}-${v.state}-${i}`}
                    paddingX={2}
                  >
                    <Box flex={1}>
                      <Flex align="center" gap={2}>
                        {v.variantId ? (
                          <Text size={1} style={{color: PURPLE}}>
                            <RhombusIcon />
                          </Text>
                        ) : null}
                        <Text size={1}>{label(v)}</Text>
                      </Flex>
                    </Box>
                    <Button
                      data-testid="open-beside"
                      fontSize={1}
                      mode="bleed"
                      onClick={() => {
                        setOpen(false)
                        go(
                          openDocBesidePath(
                            window.location.pathname,
                            documentType,
                            documentId,
                            addressOf(v),
                          ),
                        )
                      }}
                      padding={2}
                      text="Open beside"
                    />
                  </Flex>
                ))}
                <Box paddingX={2} paddingTop={1}>
                  <Text muted size={0}>
                    Cmd-click a row to open it beside.
                  </Text>
                </Box>
              </Stack>
            </Card>
          ) : (
            <span />
          )
        }
        floatingBoundary={document.body}
        open={open}
        padding={0}
        placement="right-start"
        portal
        referenceBoundary={document.body}
        referenceElement={anchor}
      />
    </>
  )
}

/** listFlyout C: Cmd-click anywhere on a list row opens that document beside the current one. Mounted once. */
export function CmdClickOpensBeside() {
  const flyout = useOption('listFlyout')
  const go = useGo()
  const global = useGlobalAddress()
  useEffect(() => {
    if (flyout !== 'c') return undefined
    const onClick = (event: MouseEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const link = (event.target as HTMLElement | null)?.closest(
        'a[data-testid^="pane-item-"]',
      ) as HTMLAnchorElement | null
      if (!link) return
      const doc = docIdFromHref(link.getAttribute('href') ?? '')
      if (!doc) return
      event.preventDefault()
      event.stopPropagation()
      go(openDocBesidePath(window.location.pathname, doc.type, doc.id, global))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  })
  return null
}

/** listMark C: the side rule and tint of the whole "Has variant" side, on the rows that carry the marker. */
export function ListMarkStyles() {
  const mark = useOption('listMark')
  if (mark !== 'c') return null
  return (
    <style data-testid="list-mark-styles">{`
a[data-testid^="pane-item-"]:has([data-e9-has]) { box-shadow: inset 3px 0 0 ${PURPLE}; background: color-mix(in srgb, ${PURPLE} 7%, transparent); border-radius: 0 6px 6px 0; }
[data-testid="list-section-has"] { background: color-mix(in srgb, ${PURPLE} 7%, transparent); box-shadow: inset 3px 0 0 ${PURPLE}; }
`}</style>
  )
}
