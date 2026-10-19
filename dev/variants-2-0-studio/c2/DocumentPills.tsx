import {Flex, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {type ReactElement} from 'react'
import {ReleaseAvatarIcon, usePerspective, useSetPerspective} from 'sanity'

import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {useDimensions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'

/**
 * C2 V1 (document pills), live data: one row of version pills for the open document. It is added under the pane
 * header; stock Studio's own pills stay where they are. Two forms, from the Figma drafts (C2 227:1925 and 227:1929).
 * "It does not have to be perfect": variant rows are read-only here (stock Studio with the flag off has no variant
 * route), release rows switch the studio perspective.
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
  return <ReleaseAvatarIcon releaseType={v.state === 'scheduled' ? 'scheduled' : v.state === 'asap' ? 'asap' : 'undecided'} />
}

function DropdownPill(props: {text: string; items: {key: string; text: string; icon: ReactElement; onClick?: () => void}[]; testId: string}) {
  return (
    <MenuButton
      button={<Chip data-testid={props.testId} iconRight={ChevronDownIcon} mode="ghost" text={props.text} />}
      id={props.testId}
      menu={
        <Menu padding={1}>
          {props.items.length ? (
            props.items.map((item) => (
              <MenuItem disabled={!item.onClick} icon={item.icon} key={item.key} onClick={item.onClick} text={item.text} />
            ))
          ) : (
            <MenuItem disabled text="None" />
          )}
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

export function DocumentPillsV1({documentId, option}: {documentId: string; option: 'a' | 'b'}) {
  const versions = useVersionList(documentId)
  const {selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const dimensions = useDimensions()
  // Never render nothing: the pane header's chip scroller observes this row's element.
  if (!versions) return <Flex data-testid={`doc-pills-${option}`} gap={1} />

  const base = versions.filter((v) => v.audience === null)
  const published = base.find((v) => v.state === 'published')
  const draft = base.find((v) => v.state === 'draft')
  // Every version that sits in a release counts, base or variant.
  const releases = versions.filter((v) => v.release)
  const variants = versions.filter((v) => v.audience !== null)
  const current = selectedPerspectiveName ?? 'drafts'

  const releaseItems = releases.map((v) => ({
    key: `${v.bundleId}-${v.audience ?? 'base'}`,
    text: `${v.audience ? `${v.audience} · ` : ''}${stateWord(v)}`,
    icon: glyph(v),
    onClick: () => v.bundleId && setPerspective(v.bundleId),
  }))

  return (
    // It replaces the stock pills in the pane header (PROPOSED slot), so it takes the header's own row, no border.
    <Flex align="center" data-testid={`doc-pills-${option}`} gap={1}>
      {option === 'a' ? (
        <>
          {published && (
            <Chip icon={<ReleaseAvatarIcon release="published" />} mode="ghost" onClick={() => setPerspective('published')} selected={current === 'published'} text="Published" />
          )}
          {/* The stock row always offers Draft (it can be created), so this does too. */}
          <Chip icon={<ReleaseAvatarIcon release="drafts" />} mode="ghost" onClick={() => setPerspective('drafts')} selected={current === 'drafts'} text="Draft" />
          <DropdownPill
            items={releaseItems}
            testId="pills-releases"
            text={`Releases (${releases.length})`}
          />
          <DropdownPill
            items={variants.map((v, i) => ({key: `${v.audience}-${i}`, text: `${v.audience} · ${stateWord(v)}`, icon: glyph(v)}))}
            testId="pills-variants"
            text={`Variants (${variants.length})`}
          />
        </>
      ) : (
        <>
          <DropdownPill
            items={[...(published ? [{key: 'pub', text: 'Published', icon: <ReleaseAvatarIcon release="published" />, onClick: () => setPerspective('published')}] : []), ...(draft ? [{key: 'draft', text: 'Draft', icon: <ReleaseAvatarIcon release="drafts" />, onClick: () => setPerspective('drafts')}] : []), ...releaseItems]}
            testId="axis-state"
            text="State"
          />
          {dimensions.map((dimension) => {
            const mine = variants.filter((v) => dimension.values.some(([, title]) => title === v.audience))
            return (
              <DropdownPill
                items={mine.map((v, i) => ({key: `${v.audience}-${i}`, text: `${v.audience} · ${stateWord(v)}`, icon: glyph(v)}))}
                key={dimension.name}
                testId={`axis-${dimension.name}`}
                text={`${dimension.title} (${mine.length})`}
              />
            )
          })}
        </>
      )}
    </Flex>
  )
}
