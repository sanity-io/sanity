import {CloseIcon} from '@sanity/icons/Close'
import {Box, Button, Card, Dialog, Flex, Select, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {type SystemVariant, valueTitle} from '../c1/model'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {StateDot} from '../c3/StateGlyph'
import {ConfirmDialog, useBulk} from '../c5/Actionable'
import {useCorpus} from '../c5/useCorpus'
import {usePerspectiveMatch} from '../data/match'
import {matchOf} from '../data/matchCore'
import {useVersionList} from '../data/useVersionList'
import {useOptionState} from '../options/store'

/**
 * "What will my visitors see?" (call of 20 Oct): the editor's one question for the perspective in the bar, answered beside the inventory panel
 * in a component of our own (the panel's files stay Andrej's). Three states:
 *   full match     only that: the variant that fits, the published version first (it is what is served), the draft beneath as secondary
 *   partial match  the same, plus a prompt to create a variant that covers every value of the perspective
 *   no match       says so plainly (visitors see the base document) and offers "Create a variant for this perspective"
 * The CTA reuses the Create version dialog (the C5 `ConfirmDialog`) with the definition preselected from the perspective. When no definition
 * exists for the perspective yet, it sends the editor to the Variants tool to define one. Fallback information is not here: it is in the
 * delete dialog only.
 */

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
const titleOf = (d: SystemVariant | undefined, id: string) => d?.metadata?.title ?? id

function Label({children}: {children: string}) {
  return (
    <Text
      muted
      size={0}
      style={{letterSpacing: '0.5px', textTransform: 'uppercase'}}
      weight="semibold"
    >
      {children}
    </Text>
  )
}

/** A served-version row: the state dot, the variant's name, and what it is. */
function VersionRow(props: {
  state: 'published' | 'draft'
  name: string
  detail: string
  testId: string
  muted?: boolean
}) {
  return (
    <Card border data-testid={props.testId} padding={3} radius={2} tone="default">
      <Flex align="flex-start" gap={3}>
        <Box paddingTop={1}>
          <StateDot kind={props.state} />
        </Box>
        <Stack gap={2}>
          <Text muted={props.muted} size={1} weight="medium">
            {props.name}
          </Text>
          <Text muted size={1}>
            {props.detail}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}

function LensBody(props: {documentId: string; title: string; onClose: () => void}) {
  const {documentId, title, onClose} = props
  const versions = useVersionList(documentId)
  const definitions = useVariantDefinitions()
  const address = usePerspectiveState()
  const perspective = usePerspectiveMatch()
  const corpus = useCorpus()
  const bulk = useBulk()
  const router = useRouter()
  const [choosing, setChoosing] = useState(false)
  const [chosenId, setChosenId] = useState('')
  const [target, setTarget] = useState<string | undefined>()

  const variantIds = useMemo(
    () => (versions ?? []).flatMap((v) => (v.variantId ? [v.variantId] : [])),
    [versions],
  )
  const matching = perspective.matching(variantIds)
  const best = matching.find((m) => m.kind === 'full') ?? matching[0]
  const label = address.valueTitles.join(' · ')

  if (!versions)
    return (
      <Text muted size={1}>
        Loading versions…
      </Text>
    )
  if (!perspective.active) {
    return (
      <Text data-testid="lens-idle" muted size={1}>
        Choose who to look at in the perspective bar. This then says which version of the document
        they are served.
      </Text>
    )
  }

  const baseDoc = versions.find((v) => v.audience === null && v.state === 'published')
  // What the Create dialog can offer: the definitions this document has no version of yet. Of those, the ones that FIT the perspective (every
  // condition holds in it). Exactly one fits: the dialog preselects it. None or several: nothing is preselected and the editor picks.
  const lacking = definitions.filter((d) => !variantIds.includes(shortId(d._id)))
  const fitting = lacking.filter((d) => matchOf(d.conditions, perspective.chosen) !== null)
  const offered = fitting.length ? fitting : lacking
  const start = (id: string) => {
    setTarget(id)
    bulk.open('create', [{docId: documentId, title, variantId: id, rows: []}])
  }
  const create = () => {
    if (!lacking.length) {
      onClose()
      router.navigateUrl({path: '/variants'})
      return
    }
    if (fitting.length === 1) {
      start(shortId(fitting[0]._id))
      return
    }
    setChosenId('')
    setChoosing(true)
  }
  const ctaText = lacking.length
    ? 'Create a variant for this perspective'
    : 'Define a variant for this perspective'
  const targetDefinition = definitions.find((d) => shortId(d._id) === target)
  const dialog = (
    <>
      {corpus && target ? (
        <ConfirmDialog
          address={titleOf(targetDefinition, target)}
          bulk={bulk}
          corpus={corpus}
          definitions={definitions}
          onDone={() => undefined}
        />
      ) : null}
      {choosing ? (
        <Dialog
          header="Create a variant for this perspective"
          id="lens-pick-definition"
          onClose={() => setChoosing(false)}
          width={0}
        >
          <Stack data-testid="lens-pick" gap={4} padding={4}>
            <Text muted size={1}>
              {fitting.length > 1
                ? `${fitting.length} definitions fit ${label}.`
                : `No definition fits ${label} exactly.`}{' '}
              Pick the one to create.
            </Text>
            <Select
              data-testid="lens-pick-select"
              fontSize={1}
              onChange={(e) => setChosenId(e.currentTarget.value)}
              value={chosenId}
            >
              <option disabled value="">
                Choose a definition
              </option>
              {offered.map((d) => (
                <option key={d._id} value={shortId(d._id)}>
                  {titleOf(d, shortId(d._id))}
                </option>
              ))}
            </Select>
            <Flex gap={2} justify="flex-end">
              <Button fontSize={1} mode="bleed" onClick={() => setChoosing(false)} text="Cancel" />
              <Button
                data-testid="lens-pick-continue"
                disabled={!chosenId}
                fontSize={1}
                onClick={() => {
                  setChoosing(false)
                  start(chosenId)
                }}
                text="Continue"
              />
            </Flex>
          </Stack>
        </Dialog>
      ) : null}
    </>
  )

  const subtitle = (
    <Text data-testid="lens-for" size={1} style={{color: 'var(--card-badge-suggest-fg-color)'}}>
      For {label}
    </Text>
  )

  if (!best) {
    return (
      <Stack data-testid="lens-none" gap={4}>
        {subtitle}
        <Card
          padding={3}
          radius={3}
          tone="primary"
          style={{background: 'var(--card-badge-suggest-bg-color)'}}
        >
          <Stack gap={2}>
            <Text size={1} weight="semibold">
              Nothing is set for this perspective
            </Text>
            <Text size={1}>
              Visitors in {label} see{' '}
              {baseDoc ? 'the base document' : 'nothing yet: the base document is not published'}.
            </Text>
          </Stack>
        </Card>
        <Flex>
          <Button data-testid="lens-cta" fontSize={1} onClick={create} padding={2} text={ctaText} />
        </Flex>
        {dialog}
      </Stack>
    )
  }

  const definition = definitions.find((d) => shortId(d._id) === best.variantId)
  const name = titleOf(definition, best.variantId)
  const published = versions.find(
    (v) => v.variantId === best.variantId && v.state === 'published' && !v.release,
  )
  const draft = versions.find((v) => v.variantId === best.variantId && v.state === 'draft')
  const covered = Object.keys(definition?.conditions ?? {})
  // The values of the perspective this variant does not cover, by name ("Returning visitors"), as the Figma frame says it.
  const missing = address.dimensions
    .filter((d) => perspective.chosen[d.name] && !covered.includes(d.name))
    .map((d) => valueTitle(d, perspective.chosen[d.name]))

  return (
    <Stack data-testid={best.kind === 'full' ? 'lens-full' : 'lens-partial'} gap={4}>
      {subtitle}
      {best.kind === 'partial' ? (
        <Card data-testid="lens-partial-prompt" padding={3} radius={3} tone="caution">
          <Stack gap={2}>
            <Text size={1} weight="semibold">
              Partly matched
            </Text>
            <Text size={1}>
              Visitors in {label} get the {name} version. It does not cover{' '}
              {missing.join(' and ') || 'every value'}.
            </Text>
          </Stack>
        </Card>
      ) : null}
      <Stack gap={2}>
        <Label>Served now</Label>
        <div data-testid="lens-served">
          {published ? (
            <VersionRow detail="Published" name={name} state="published" testId="lens-served-row" />
          ) : (
            <Card border padding={3} radius={2} tone="caution">
              <Text size={1}>
                {name} is not published yet. Until it is, visitors see the base document.
              </Text>
            </Card>
          )}
        </div>
      </Stack>
      {draft ? (
        <Stack gap={2}>
          <Label>Draft, not served</Label>
          <div data-testid="lens-draft">
            <VersionRow
              detail="Has changes that are not published, so visitors do not see them"
              muted
              name={name}
              state="draft"
              testId="lens-draft-row"
            />
          </div>
        </Stack>
      ) : null}
      {best.kind === 'partial' && lacking.length > 0 ? (
        <Flex>
          <Button data-testid="lens-cta" fontSize={1} onClick={create} padding={2} text={ctaText} />
        </Flex>
      ) : null}
      {dialog}
    </Stack>
  )
}

/** The line above the inventory list: it opens the lens in the panel's place. */
export function VisitorLensLine({onOpen}: {onOpen: () => void}) {
  return (
    <Box padding={1}>
      <Button
        data-testid="visitor-lens-open"
        fontSize={1}
        mode="bleed"
        onClick={onOpen}
        padding={2}
        style={{height: 31, width: '100%', justifyContent: 'flex-start'}}
        text="What will my visitors see?"
      />
    </Box>
  )
}

/** The lens, as the Figma E1 to E3 frames draw it: a header with a close, the perspective it is for, then the answer. */
export function VisitorLensPanel({
  documentId,
  title,
  onClose,
}: {
  documentId: string
  title: string
  onClose: () => void
}) {
  return (
    <Stack data-testid="visitor-lens" gap={4} padding={3}>
      <Flex align="center" gap={2}>
        <Box flex={1}>
          <Text size={1} weight="medium">
            What will my visitors see?
          </Text>
        </Box>
        <Button
          aria-label="Close"
          data-testid="visitor-lens-close"
          icon={CloseIcon}
          mode="bleed"
          onClick={onClose}
          padding={2}
        />
      </Flex>
      <LensBody documentId={documentId} onClose={onClose} title={title} />
    </Stack>
  )
}

/**
 * Open beta scope: the inventory's Priority view is hidden from the views menu (Look and World settings: "Priority view", default hide).
 * Andrej's panel has no prop for its list of views (a private constant in InventoryMenus), and his files are not ours to edit before his
 * handoff, so this hides the menu item from the outside. When the handoff brings a views prop, this goes and the list is passed instead.
 */
export function HidePriorityView() {
  const {priorityView} = useOptionState()
  useEffect(() => {
    if (priorityView !== 'hide') return undefined
    const hide = () => {
      for (const item of document.querySelectorAll<HTMLElement>('[role=menuitem]')) {
        if (item.textContent?.trim().startsWith('By priority')) item.style.display = 'none'
      }
    }
    hide()
    const observer = new MutationObserver(hide)
    observer.observe(document.body, {childList: true, subtree: true})
    return () => observer.disconnect()
  }, [priorityView])
  return null
}
