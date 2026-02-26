import {type EditorSelection, PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {type ReleaseDocument} from '@sanity/client'
import {type Path} from '@sanity/types'
import {type BadgeTone, Box, Text, useClickOutsideEvent} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type JSX, useCallback, useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {Popover, Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useAllReleases} from '../../store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTitleDetails} from '../../util/getReleaseTitleDetails'
import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'
import {ReleasePickerMenu} from './ReleasePickerMenu'

function isArchivedRelease(release: ReleaseDocument): boolean {
  return release.state === 'archived' || release.state === 'published'
}

const ChipSpan = styled.span<{$tone: BadgeTone; $clickable: boolean; $hasIcon?: boolean}>(
  ({$tone, $clickable, $hasIcon = true}) => `
    display: inline-flex;
    align-items: center;
    gap: 1px;
    color: var(--card-badge-${$tone}-fg-color);
    background-color: var(--card-badge-${$tone}-bg-color);
    border-radius: 999px;
    padding: 2px 7px 2px ${$hasIcon ? '3px' : '7px'};
    margin: 0 1px;
    cursor: ${$clickable ? 'pointer' : 'default'};
    text-decoration: none;
    font-size: 0.95em;
    font-weight: 500;
    white-space: nowrap;

    &:hover {
      opacity: ${$clickable ? '0.8' : '1'};
    }

    &[data-selected='true'] {
      box-shadow: 0 0 0 1.5px var(--card-focus-ring-color);
    }
  `,
)

const PendingChipSpan = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 1px;
  color: var(--card-muted-fg-color);
  background-color: var(--card-badge-default-bg-color);
  border: 1px dashed var(--card-border-color);
  border-radius: 999px;
  padding: 2px 7px 2px 3px;
  margin: 0 1px;
  font-size: 0.95em;
  font-weight: 500;
  white-space: nowrap;
`

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 1.1em;
`

interface ReleaseReferenceChipProps {
  releaseId: string
  selected: boolean
  path: Path
  excludeReleaseId?: string
}

export function ReleaseReferenceChip(props: ReleaseReferenceChipProps): JSX.Element {
  const {releaseId, selected, path, excludeReleaseId} = props
  const isPending = releaseId === ''

  if (isPending) {
    return (
      <PendingReleaseChip path={path} selected={selected} excludeReleaseId={excludeReleaseId} />
    )
  }

  return <ResolvedReleaseChip releaseId={releaseId} selected={selected} />
}

function PendingReleaseChip({
  path,
  selected,
  excludeReleaseId,
}: {
  path: Path
  selected: boolean
  excludeReleaseId?: string
}): JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const editor = usePortableTextEditor()
  const [chipElement, setChipElement] = useState<HTMLSpanElement | null>(null)
  const popoverContentRef = useRef<HTMLDivElement | null>(null)
  const hasActed = useRef(false)

  const selfSelection = useMemo(
    (): EditorSelection => ({
      anchor: {path, offset: 0},
      focus: {path, offset: 0},
    }),
    [path],
  )

  const handleRemove = useCallback(() => {
    if (hasActed.current) return
    hasActed.current = true
    PortableTextEditor.delete(editor, selfSelection, {mode: 'children'})
    PortableTextEditor.focus(editor)
  }, [editor, selfSelection])

  const handleSelect = useCallback(
    (selectedReleaseId: string) => {
      if (hasActed.current) return
      hasActed.current = true
      PortableTextEditor.delete(editor, selfSelection, {mode: 'children'})

      const schemaType = editor.schemaTypes.inlineObjects.find(
        (inlineType) => inlineType.name === 'releaseReference',
      )

      if (schemaType === undefined) {
        console.error('Schema type "releaseReference" not found')
        return
      }

      PortableTextEditor.insertChild(editor, schemaType, {
        _type: 'releaseReference',
        _key: randomKey(12),
        releaseId: selectedReleaseId,
      })

      PortableTextEditor.insertChild(editor, editor.schemaTypes.span, {
        _type: 'span',
        text: ' ',
      })

      PortableTextEditor.focus(editor)
    },
    [editor, selfSelection],
  )

  useClickOutsideEvent(handleRemove, () => [popoverContentRef.current, chipElement])

  return (
    <>
      <PendingChipSpan ref={setChipElement} data-selected={selected}>
        <IconWrapper>
          <ReleaseAvatarIcon tone="default" />
        </IconWrapper>
        {t('release-reference.pending')}
      </PendingChipSpan>
      {chipElement && (
        <Popover
          content={
            <div ref={popoverContentRef}>
              <ReleasePickerMenu onSelect={handleSelect} excludeReleaseId={excludeReleaseId} />
            </div>
          }
          open
          portal
          placement="bottom-start"
          fallbackPlacements={['top-start', 'bottom-end', 'top-end']}
          referenceElement={chipElement}
        />
      )}
    </>
  )
}

function ResolvedReleaseChip({
  releaseId,
  selected,
}: {
  releaseId: string
  selected: boolean
}): JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const router = useRouter()
  const {data: releases, loading} = useAllReleases()

  const release = useMemo(() => {
    if (loading) return null
    return releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === releaseId) ?? null
  }, [releases, releaseId, loading])

  const tone: BadgeTone = release === null ? 'default' : getReleaseTone(release)

  const intentHref = useMemo(
    () => router.resolveIntentLink('release', {id: releaseId}),
    [router, releaseId],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>): void => {
      e.preventDefault()
      window.open(intentHref, '_blank', 'noopener,noreferrer')
    },
    [intentHref],
  )

  if (loading) {
    return (
      <ChipSpan $clickable={false} $tone="default" data-selected={selected}>
        <IconWrapper>
          <ReleaseAvatarIcon tone="default" />
        </IconWrapper>
        Loading...
      </ChipSpan>
    )
  }

  if (release === null) {
    return (
      <ChipSpan $clickable={false} $tone="default" $hasIcon={false} data-selected={selected}>
        {releaseId}
      </ChipSpan>
    )
  }

  const isArchived = isArchivedRelease(release)
  const {displayTitle, fullTitle, isTruncated} = getReleaseTitleDetails(
    release.metadata.title,
    'Untitled Release',
  )

  const chip = (
    <ChipSpan
      $clickable
      $tone={tone}
      data-selected={selected}
      onClick={handleClick}
      title={isTruncated ? undefined : t('release-reference.title', {title: fullTitle})}
    >
      <IconWrapper>
        <ReleaseAvatarIcon release={release} />
      </IconWrapper>
      {isArchived ? <s>{displayTitle}</s> : displayTitle}
    </ChipSpan>
  )

  if (isTruncated) {
    return (
      <Tooltip
        content={
          <Box style={{maxWidth: '300px'}}>
            <Text size={1}>{fullTitle}</Text>
          </Box>
        }
      >
        {chip}
      </Tooltip>
    )
  }

  return chip
}
