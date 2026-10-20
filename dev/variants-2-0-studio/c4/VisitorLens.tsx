import {AddIcon} from '@sanity/icons/Add'
import {Box, Button, Card, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {type SystemVariant} from '../c1/model'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {ConfirmDialog, useBulk} from '../c5/Actionable'
import {useCorpus} from '../c5/useCorpus'
import {usePerspectiveMatch} from '../data/match'
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

function LensBody(props: {documentId: string; title: string; onClose: () => void}) {
  const {documentId, title, onClose} = props
  const versions = useVersionList(documentId)
  const definitions = useVariantDefinitions()
  const address = usePerspectiveState()
  const perspective = usePerspectiveMatch()
  const corpus = useCorpus()
  const bulk = useBulk()
  const router = useRouter()

  const variantIds = useMemo(
    () => (versions ?? []).flatMap((v) => (v.variantId ? [v.variantId] : [])),
    [versions],
  )
  const matching = perspective.matching(variantIds)
  const best = matching.find((m) => m.kind === 'full') ?? matching[0]
  const label = address.valueTitles.join(', ')

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
  // The definition whose conditions are exactly the perspective: what a "full" variant would be.
  const exact = definitions.find((d) => {
    const own = Object.entries(d.conditions)
    return (
      own.length === Object.keys(perspective.chosen).length &&
      own.every(([k, v]) => perspective.chosen[k] === v)
    )
  })
  const exactId = exact ? shortId(exact._id) : undefined
  const hasExactVersion = !!exactId && variantIds.includes(exactId)

  const create = () => {
    if (!exact || !exactId) {
      onClose()
      router.navigateUrl({path: '/variants'})
      return
    }
    bulk.open('create', [{docId: documentId, title, variantId: exactId, rows: []}])
  }
  const ctaText = exact
    ? 'Create a variant for this perspective'
    : 'Define a variant for this perspective'

  const dialog =
    corpus && exact ? (
      <ConfirmDialog
        address={titleOf(exact, exactId ?? '')}
        bulk={bulk}
        corpus={corpus}
        definitions={definitions}
        onDone={() => undefined}
      />
    ) : null

  if (!best) {
    return (
      <Stack data-testid="lens-none" gap={4}>
        <Text size={1}>
          No variant of this document matches <b>{label}</b>.
        </Text>
        <Text muted size={1}>
          Visitors with these values are served{' '}
          {baseDoc
            ? 'the published base document'
            : 'nothing yet: the base document is not published'}
          .
        </Text>
        <Flex>
          <Button
            data-testid="lens-cta"
            icon={AddIcon}
            mode="ghost"
            onClick={create}
            text={ctaText}
          />
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
  const covers = Object.keys(definition?.conditions ?? {}).length
  const total = Object.keys(perspective.chosen).length

  return (
    <Stack data-testid={best.kind === 'full' ? 'lens-full' : 'lens-partial'} gap={4}>
      <Stack gap={2}>
        <Text muted size={1}>
          Visitors who are <b>{label}</b> are served
        </Text>
        <Card border padding={3} radius={3} tone={published ? 'positive' : 'caution'}>
          <Stack gap={2}>
            <Text data-testid="lens-served" size={2} weight="medium">
              {name}
            </Text>
            <Text muted size={1}>
              {published
                ? 'Published version'
                : 'Not published yet: until it is, visitors see the base document'}
            </Text>
          </Stack>
        </Card>
      </Stack>
      {draft ? (
        <Text data-testid="lens-draft" muted size={1}>
          Draft beneath: {name} has changes that are not published, so visitors do not see them.
        </Text>
      ) : null}
      {best.kind === 'partial' ? (
        <Card data-testid="lens-partial-prompt" padding={3} radius={3} tone="caution">
          <Stack gap={3}>
            <Text size={1}>
              This variant covers {covers} of the {total} values in the perspective. Create a
              variant that covers all of them.
            </Text>
            <Flex>
              {!hasExactVersion ? (
                <Button
                  data-testid="lens-cta"
                  icon={AddIcon}
                  mode="ghost"
                  onClick={create}
                  text="Create a full variant"
                />
              ) : null}
            </Flex>
          </Stack>
        </Card>
      ) : null}
      {dialog}
    </Stack>
  )
}

/** The line above the inventory list, and the lens it opens. */
export function VisitorLensLine({documentId, title}: {documentId: string; title: string}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Box padding={1}>
        <Button
          data-testid="visitor-lens-open"
          fontSize={1}
          mode="bleed"
          onClick={() => setOpen(true)}
          padding={2}
          style={{height: 31, width: '100%', justifyContent: 'flex-start'}}
          text="What will my visitors see?"
        />
      </Box>
      {open ? (
        <Dialog
          header="What will my visitors see?"
          id="visitor-lens"
          onClose={() => setOpen(false)}
          width={1}
        >
          <Box data-testid="visitor-lens" padding={4}>
            <LensBody documentId={documentId} onClose={() => setOpen(false)} title={title} />
          </Box>
        </Dialog>
      ) : null}
    </>
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
