import {type ReleaseDocument} from '@sanity/client'
import {ChevronDownIcon, ChevronUpIcon} from '@sanity/icons'
import {Container, Flex, useClickOutsideEvent} from '@sanity/ui'
import {useMemo, useRef, useState} from 'react'
import {Chip, getPublishedId, getVersionFromId, useTranslation, VersionChip} from 'sanity'

import {Popover, Tooltip} from '../../../../../ui-components'

export function NonReleaseVersionsSelect(props: {
  nonReleaseVersions: string[]
  selectedPerspective?: string
  onSelectBundle: (bundle: string) => void
  onCopyToDraftsNavigate: () => void
  releases: ReleaseDocument[]
  releasesLoading: boolean
  documentType: string
}) {
  const {
    nonReleaseVersions,
    selectedPerspective,
    onSelectBundle,
    onCopyToDraftsNavigate,
    documentType,
    releasesLoading,
    releases,
  } = props
  const {t} = useTranslation()
  const [nonReleaseDropdownOpen, setNonReleaseDropdownOpen] = useState(false)
  const [popoverReferenceElement, setPopoverReferenceElement] = useState<HTMLElement | null>(null)

  const [selectedNonReleaseVersion, otherNonReleaseVersions] = useMemo(() => {
    return extract(nonReleaseVersions, (v) => getVersionFromId(v) === selectedPerspective)
  }, [selectedPerspective, nonReleaseVersions])

  const popoverRef = useRef(null)

  useClickOutsideEvent(
    (event) => {
      if (event.target && 'matches' in event.target && typeof event.target.matches === 'function') {
        // note: this is an (ugly) workaround for useClickOutside not working through portals (as its based on elements.contains())
        // do not close dropdown if click happens in a portal
        // note: this *can* cause false positives if the user clicks outside any other portal
        // element on the page and expects the dropdown to close
        const isPortal = (event.target as {matches: HTMLElement['matches']}).matches(
          '[data-portal] *',
        )
        if (!isPortal) {
          setNonReleaseDropdownOpen(false)
        }
      } else {
        setNonReleaseDropdownOpen(false)
      }
    },
    () => [popoverRef.current],
  )

  if (nonReleaseVersions.length === 0) {
    return null
  }

  return (
    <>
      {selectedNonReleaseVersion &&
        (() => {
          const bundleId = getVersionFromId(selectedNonReleaseVersion)!
          return (
            <VersionChip
              key={selectedNonReleaseVersion}
              selected
              text={bundleId}
              tone="default"
              onClick={() => onSelectBundle(bundleId)}
              onCopyToDraftsNavigate={onCopyToDraftsNavigate}
              contextValues={{
                documentId: getPublishedId(selectedNonReleaseVersion),
                releases,
                releasesLoading: releasesLoading,
                documentType: documentType,
                bundleId: bundleId,
                isVersion: true,
              }}
            />
          )
        })()}
      {otherNonReleaseVersions.length > 0 ? (
        <Tooltip
          content={t('release.chip.tooltip.other-versions', {
            count: otherNonReleaseVersions.length,
          })}
          fallbackPlacements={[]}
          portal
          placement={nonReleaseDropdownOpen ? 'top' : 'bottom'}
        >
          <Chip
            mode="bleed"
            fontSize={1}
            muted
            selected={nonReleaseDropdownOpen}
            iconRight={nonReleaseDropdownOpen ? ChevronUpIcon : ChevronDownIcon}
            ref={setPopoverReferenceElement}
            onClick={() => setNonReleaseDropdownOpen((v) => !v)}
            text={t('release.chip.button.other-versions', {count: otherNonReleaseVersions.length})}
          />
        </Tooltip>
      ) : null}

      <Popover
        animate={false}
        open={nonReleaseDropdownOpen}
        portal
        arrow
        ref={popoverRef}
        placement="bottom"
        referenceElement={popoverReferenceElement}
        zOffset={10}
        content={
          <Container width={1}>
            <Flex width={1} padding={3} gap={2} wrap="wrap">
              {otherNonReleaseVersions.map((nonReleaseVersionId) => {
                const bundle = getVersionFromId(nonReleaseVersionId)!
                const selected = selectedPerspective === bundle

                return (
                  <VersionChip
                    key={nonReleaseVersionId}
                    selected={selected}
                    text={bundle}
                    disabled={false}
                    contextMenuPortal={false}
                    tone="default"
                    onClick={() => onSelectBundle(bundle)}
                    onCopyToDraftsNavigate={onCopyToDraftsNavigate}
                    contextValues={{
                      documentId: getPublishedId(nonReleaseVersionId),
                      releases,
                      releasesLoading: releasesLoading,
                      documentType: documentType,
                      bundleId: bundle,
                      isVersion: true,
                    }}
                  />
                )
              })}
            </Flex>
          </Container>
        }
      />
    </>
  )
}

function extract<T>(xs: T[], predicate: (x: T) => boolean): [T | undefined, T[]] {
  const i = xs.findIndex(predicate)
  const match = i === -1 ? undefined : xs[i]
  const rest = i === -1 ? xs : xs.slice(0, i).concat(xs.slice(i + 1))

  return [match, rest]
}
