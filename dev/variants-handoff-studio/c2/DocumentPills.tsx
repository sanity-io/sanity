import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Box, Flex, Text, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ReactElement, useState} from 'react'
import {ReleaseAvatarIcon, usePerspective, useSchema, useSetPerspective, useWorkspace} from 'sanity'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {rankSearch, SEARCH_FROM, type SearchFields} from '../c1/search'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'

/**
 * C2 option A (the open beta, OPEN-BETA-HANDOFF-SCOPE T2): the document pills with their order and grouping changed, in the same place as the
 * Studio's own pills. Variants group first, a divider, Published, Draft, then one Releases group: one entry per release in its menu, with the
 * variants it holds under it, and the count is the number of releases. The way into the inventory is the pane header's own button, so there is
 * no Versions pill. Titles, never ids. A group is not drawn when it is empty: no Variants pill without variants, no Releases pill without
 * releases, no Draft pill when the workspace has no draft model or the type is live edit.
 */

const stateWord = (v: AudienceVersion) =>
  v.state === 'published'
    ? 'Published'
    : v.state === 'draft'
      ? 'Draft'
      : v.release
        ? `${v.release}${v.when ? ` · ${v.when}` : ''}`
        : v.state

function glyph(v: AudienceVersion) {
  if (v.state === 'published') return <ReleaseAvatarIcon release="published" />
  if (v.state === 'draft') return <ReleaseAvatarIcon release="drafts" />
  return (
    <ReleaseAvatarIcon
      releaseType={
        v.state === 'scheduled' ? 'scheduled' : v.state === 'asap' ? 'asap' : 'undecided'
      }
    />
  )
}

function DropdownPill(props: {
  text: string
  items: {
    key: string
    text: string
    icon: ReactElement
    onClick?: () => void
    /** A variant listed under its release: it is found, and shown, with the release above it. */
    indent?: boolean
    /** What search matches an option by (the title is its text when this is left out). */
    search?: Omit<SearchFields, 'title'>
  }[]
  testId: string
}) {
  const [query, setQuery] = useState('')
  // An option is a top-level item with the indented items under it.
  type Item = (typeof props.items)[number]
  const groups: {head: Item; children: Item[]}[] = []
  for (const item of props.items) {
    const last = groups[groups.length - 1]
    if (item.indent && last) last.children.push(item)
    else groups.push({head: item, children: []})
  }
  const searchable = groups.length >= SEARCH_FROM
  const found = rankSearch(groups, searchable ? query : '', (g) => ({
    title: g.head.text,
    ...g.head.search,
  }))
  return (
    <MenuButton
      button={
        <Chip
          data-testid={props.testId}
          iconRight={ChevronDownIcon}
          mode="ghost"
          text={props.text}
        />
      }
      id={props.testId}
      menu={
        <Menu data-testid={`${props.testId}-menu`} padding={1} style={{minWidth: 240}}>
          {searchable ? (
            <Box padding={1}>
              <TextInput
                aria-label="Find"
                data-testid={`${props.testId}-search`}
                fontSize={1}
                // The menu would take typing for its own keys; only the arrows are its.
                onKeyDown={(event) => {
                  if (!['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key))
                    event.stopPropagation()
                }}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Find"
                value={query}
              />
            </Box>
          ) : null}
          {found.flatMap(({item: g, reason}) =>
            [g.head, ...g.children].map((item) => (
              <MenuItem
                __unstable_subtitle={item === g.head ? reason : undefined}
                disabled={!item.onClick}
                icon={item.icon}
                key={item.key}
                onClick={item.onClick}
                style={item.indent ? {marginLeft: 24} : undefined}
                text={item.text}
              />
            )),
          )}
          {searchable && !found.length ? (
            <Box padding={3}>
              <Text muted size={1}>{`Nothing matches “${query}”.`}</Text>
            </Box>
          ) : null}
        </Menu>
      }
      onClose={() => setQuery('')}
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

export function DocumentPillsV1({
  documentId,
  documentType,
}: {
  documentId: string
  documentType: string
}) {
  const versions = useVersionList(documentId)
  const {selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const address = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const schemaType = useSchema().get(documentType)
  const draftsEnabled = useWorkspace().document.drafts.enabled
  // Never render nothing: the pane header's chip scroller observes this row's element.
  if (!versions) return <Flex data-testid="doc-pills-a" gap={1} />

  const published = versions.find((v) => v.audience === null && v.state === 'published')
  // Every version that sits in a release counts, base or variant.
  const releases = versions.filter((v) => v.release)
  const variants = versions.filter((v) => v.audience !== null)
  const current = selectedPerspectiveName ?? 'drafts'
  // Live edit has no draft, and a workspace without the draft model has none either.
  const showDrafts = draftsEnabled && !schemaType?.liveEdit
  const showPublished = Boolean(published) || (!showDrafts && !releases.length)

  // Choosing a variant sets the address (version and values) like the inventory does.
  const selectVariant = (v: AudienceVersion) => () => {
    const definition = definitions.find((d) => d._id.replace(/^_\.variants\./, '') === v.variantId)
    setPerspective(v.bundleId ?? (v.state === 'published' ? 'published' : 'drafts'))
    address.setChosen(definition ? definition.conditions : {})
  }
  const variantItems = variants.map((v, i) => {
    const definition = definitions.find((d) => d._id.replace(/^_\.variants\./, '') === v.variantId)
    return {
      key: `${v.audience}-${i}`,
      text: `${v.audience} · ${stateWord(v)}`,
      icon: glyph(v),
      onClick: selectVariant(v),
      search: {
        condition: definition
          ? Object.entries(definition.conditions)
              .map(([name, value]) => `${name}: ${value}`)
              .join(', ')
          : undefined,
        id: v.variantId ?? undefined,
      },
    }
  })
  // One entry per RELEASE (the pill counts releases, not versions); the versions it holds are listed under it: the document, then its variants.
  const releaseGroups = [...new Set(releases.map((v) => v.bundleId))].flatMap((bundleId) => {
    const inRelease = releases.filter((v) => v.bundleId === bundleId)
    const head = inRelease[0]
    return [
      {
        key: `release-${bundleId}`,
        text: stateWord({...head, audience: null}),
        icon: glyph(head),
        onClick: () => bundleId && setPerspective(bundleId),
        search: {id: bundleId ?? undefined},
      },
      ...inRelease.map((v) => ({
        key: `release-${bundleId}-${v.audience ?? 'base'}`,
        text: v.audience ?? 'Base document',
        icon: <RhombusIcon />,
        indent: true,
        onClick: () => selectVariant(v)(),
      })),
    ]
  })
  const releaseCount = new Set(releases.map((v) => v.bundleId)).size
  const hasEarlierGroup = variants.length > 0

  return (
    // It replaces the stock pills in the pane header (PROPOSED slot), so it takes the header's own row, no border.
    <Flex
      align="center"
      data-testid="doc-pills-a"
      gap={2}
      style={{flex: '1 1 0%', minWidth: 0}}
      wrap="wrap"
    >
      {variants.length ? (
        <DropdownPill
          items={variantItems}
          testId="pills-variants"
          text={`Variants · ${variants.length}`}
        />
      ) : null}
      {hasEarlierGroup ? (
        <div
          aria-hidden
          data-testid="pills-divider"
          style={{
            alignSelf: 'stretch',
            width: 1,
            margin: '4px',
            background: 'var(--card-border-color)',
          }}
        />
      ) : null}
      {showPublished ? (
        <Chip
          data-testid="pills-published"
          icon={<ReleaseAvatarIcon release="published" />}
          mode="ghost"
          onClick={() => setPerspective('published')}
          selected={current === 'published'}
          text="Published"
        />
      ) : null}
      {showDrafts ? (
        <Chip
          data-testid="pills-drafts"
          icon={<ReleaseAvatarIcon release="drafts" />}
          mode="ghost"
          onClick={() => setPerspective('drafts')}
          selected={current === 'drafts'}
          text="Draft"
        />
      ) : null}
      {releases.length ? (
        <DropdownPill
          items={releaseGroups}
          testId="pills-releases"
          text={`Releases · ${releaseCount}`}
        />
      ) : null}
    </Flex>
  )
}
