import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {Flex} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ReactElement} from 'react'
import {ReleaseAvatarIcon, usePerspective, useSchema, useSetPerspective, useWorkspace} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'

/**
 * C2 option A (the open beta, OPEN-BETA-HANDOFF-SCOPE T2): the document pills with their order and grouping changed, in the same place as the
 * Studio's own pills. Variants group first, a divider, Published, Drafts, then one Releases group (all releases in its menu), then a Versions
 * button that opens the inventory. Titles, never ids. A group is not drawn when it is empty: no Variants pill without variants, no Releases pill
 * without releases, no Drafts pill when the workspace has no draft model or the type is live edit.
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
  items: {key: string; text: string; icon: ReactElement; onClick?: () => void}[]
  testId: string
}) {
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
        <Menu padding={1}>
          {props.items.map((item) => (
            <MenuItem
              disabled={!item.onClick}
              icon={item.icon}
              key={item.key}
              onClick={item.onClick}
              text={item.text}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

/** The Versions button: opens the inventory in the inspector, or closes it when it is open. */
function VersionsButton() {
  const {inspector, openInspector, closeInspector} = useDocumentPane()
  const open = inspector?.name === 'variants-inventory'
  return (
    <Chip
      data-testid="pills-versions"
      icon={DocumentsIcon}
      mode="ghost"
      onClick={() => (open ? closeInspector() : openInspector('variants-inventory'))}
      selected={open}
      text="Versions"
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
  const variantItems = variants.map((v, i) => ({
    key: `${v.audience}-${i}`,
    text: `${v.audience} · ${stateWord(v)}`,
    icon: glyph(v),
    onClick: selectVariant(v),
  }))
  const releaseItems = releases.map((v) => ({
    key: `${v.bundleId}-${v.audience ?? 'base'}`,
    text: `${v.audience ? `${v.audience} · ` : ''}${stateWord(v)}`,
    icon: glyph(v),
    onClick: () => v.bundleId && setPerspective(v.bundleId),
  }))
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
          items={releaseItems}
          testId="pills-releases"
          text={`Releases · ${releases.length}`}
        />
      ) : null}
      <VersionsButton />
    </Flex>
  )
}
