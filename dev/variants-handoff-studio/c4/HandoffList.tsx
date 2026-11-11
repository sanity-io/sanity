import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {ReleaseAvatarIcon, useSetVariant} from 'sanity'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {type InventoryEntry} from './inventory/fixtures'
import {useLiveWorld} from './inventory/useLiveWorld'

// C4 option D, "Handoff list" (OPEN-BETA-HANDOFF-SCOPE T4): the open beta inventory. ONE list of the document's versions, grouped by bundle
// (Published, Drafts, then each release). A row says what the version is (the document, or the variant) and where it stands. Nothing else: no
// search, filter, sort, grouping options, views or priority view. It reads the same live world as Andrej's panel (`useLiveWorld`, his
// `InventoryWorld`) and does not use or edit his panel files. A row sets the GLOBAL perspective, the open beta limitation.

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

interface Row {
  entry: InventoryEntry
  title: string
  isVariant: boolean
}

interface Section {
  id: string
  title: string
  /** The line under the title: `scheduled 31 Oct`, `ASAP`, nothing for Published and Drafts. */
  subtitle?: string
  icon: 'published' | 'drafts' | 'scheduled' | 'asap' | 'undecided'
  rows: Row[]
}

/** What a version is, the way the Studio says it: Published, Draft, or the release it sits in. */
const stateWord = (section: Section) =>
  section.id === 'drafts' ? 'Draft' : section.id === 'published' ? 'Published' : section.title

function SectionIcon({icon}: {icon: Section['icon']}) {
  if (icon === 'published') return <ReleaseAvatarIcon release="published" />
  if (icon === 'drafts') return <ReleaseAvatarIcon release="drafts" />
  return <ReleaseAvatarIcon releaseType={icon} />
}

export function HandoffList({documentId, title}: {documentId: string; title: string}) {
  const world = useLiveWorld(documentId, title)
  const state = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const setVariant = useSetVariant()

  const titleOfVariant = useCallback(
    (variantId: string | undefined) =>
      variantId
        ? (definitions.find((d) => shortId(d._id) === variantId)?.metadata?.title ?? variantId)
        : title,
    [definitions, title],
  )

  const sections = useMemo((): Section[] => {
    if (!world) return []
    const rowsOf = (group: string): Row[] =>
      world.entries
        .filter((entry) => entry.group === group)
        // The document first, then its variants in the order the dataset gives them.
        .sort((a, b) => Number(Boolean(a.variantId)) - Number(Boolean(b.variantId)))
        .map((entry) => ({
          entry,
          title: titleOfVariant(entry.variantId),
          isVariant: Boolean(entry.variantId),
        }))
    const base: Section[] = [
      {id: 'published', title: 'Published', icon: 'published', rows: rowsOf('published')},
      {id: 'drafts', title: 'Drafts', icon: 'drafts', rows: rowsOf('drafts')},
    ]
    const releases = world.releases
      .map((release): Section => {
        const type = release.metadata?.releaseType
        const at = release.metadata?.intendedPublishAt
        return {
          id: release.name,
          title: release.metadata?.title || release.name,
          subtitle:
            type === 'scheduled' && at
              ? `scheduled ${new Date(at).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`
              : type === 'asap'
                ? 'ASAP'
                : undefined,
          icon: type === 'scheduled' ? 'scheduled' : type === 'asap' ? 'asap' : 'undecided',
          rows: rowsOf(release.name),
        }
      })
      .filter((section) => section.rows.length)
    return [...base, ...releases].filter((section) => section.rows.length)
  }, [world, titleOfVariant])

  // The row the global perspective already shows: the version and the variant the navbar names.
  const currentKey = useMemo(() => {
    const entries = Object.entries(state.chosen)
    const exact = entries.length
      ? definitions.find((d) => {
          const own = Object.entries(d.conditions)
          return (
            own.length === entries.length && own.every(([name, key]) => state.chosen[name] === key)
          )
        })
      : undefined
    return `${state.version}:${exact ? shortId(exact._id) : 'base'}`
  }, [state.chosen, state.version, definitions])

  const select = useCallback(
    (entry: InventoryEntry) => {
      const variant = definitions.find((d) => shortId(d._id) === entry.variantId)
      // One navigation sets the version and the variant, so the document pane shows that version with the inspector still open.
      setVariant({variantId: variant?._id as never, perspective: entry.group as never})
      state.setChosen(variant ? variant.conditions : {})
    },
    [definitions, setVariant, state],
  )

  if (!world) {
    return (
      <Card padding={3}>
        <Text muted size={1}>
          Loading versions…
        </Text>
      </Card>
    )
  }

  return (
    <Box data-testid="handoff-list" overflow="auto" paddingY={2} style={{height: '100%'}}>
      <Stack gap={3}>
        {sections.map((section) => (
          <Stack data-testid={`handoff-section-${section.id}`} key={section.id} gap={1}>
            <Flex align="center" gap={2} paddingX={3} paddingY={2}>
              <Text size={1}>
                <SectionIcon icon={section.icon} />
              </Text>
              <Text size={1} weight="medium">
                {section.title}
              </Text>
              {section.subtitle ? (
                <Text muted size={1}>
                  {section.subtitle}
                </Text>
              ) : null}
            </Flex>
            <Stack paddingX={2} gap={1}>
              {section.rows.map(({entry, title: rowTitle, isVariant}) => {
                const selected = entry.key === currentKey
                return (
                  <Card
                    as="button"
                    data-selected={selected ? '' : undefined}
                    data-testid={`handoff-row-${entry.group}-${entry.variantId ?? 'base'}`}
                    key={entry.key}
                    onClick={() => select(entry)}
                    padding={2}
                    radius={2}
                    selected={selected}
                    style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
                    tone="default"
                  >
                    <Flex align="center" gap={2}>
                      <Text
                        size={1}
                        style={{
                          color: isVariant ? 'var(--card-badge-suggest-icon-color)' : undefined,
                          visibility: isVariant ? 'visible' : 'hidden',
                        }}
                      >
                        <RhombusIcon />
                      </Text>
                      <Box flex={1} style={{minWidth: 0}}>
                        <Text size={1} textOverflow="ellipsis">
                          {rowTitle}
                        </Text>
                      </Box>
                      <Text muted size={1}>
                        {stateWord(section)}
                      </Text>
                    </Flex>
                  </Card>
                )
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
