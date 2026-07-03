import {type ReleaseDocument} from '@sanity/client'
import {ChevronDownIcon, ChevronUpIcon} from '@sanity/icons'
import {Container, Flex, useClickOutsideEvent} from '@sanity/ui'
import {useMemo, useRef, useState} from 'react'
import {
  type VersionInfoDocumentStub,
  Chip,
  getPublishedId,
  getVersionFromId,
  type AgentVersionDisplay,
  useTranslation,
  VersionChip,
} from 'sanity'

import {Popover, Tooltip} from '../../../../../ui-components'

export function NonReleaseVersionsSelect(props: {
  nonReleaseVersions: VersionInfoDocumentStub[]
  selectedPerspective?: string
  onSelectBundle: (version: VersionInfoDocumentStub) => void
  onCopyToDraftsNavigate: () => void
  releases: ReleaseDocument[]
  releasesLoading: boolean
  documentType: string
  getVersionDisplay: (version: VersionInfoDocumentStub) => AgentVersionDisplay | null
  mode: 'versions' | 'variants'
}) {
  const {
    nonReleaseVersions,
    selectedPerspective,
    onSelectBundle,
    onCopyToDraftsNavigate,
    documentType,
    getVersionDisplay,
    releasesLoading,
    releases,
    mode,
  } = props
  const {t} = useTranslation()
  const [nonReleaseDropdownOpen, setNonReleaseDropdownOpen] = useState(false)
  const [popoverReferenceElement, setPopoverReferenceElement] = useState<HTMLElement | null>(null)

  const [selectedNonReleaseVersion, otherNonReleaseVersions] = useMemo(() => {
    return extract(nonReleaseVersions, (v) => getVersionFromId(v._id) === selectedPerspective)
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
          const bundleId = getVersionFromId(selectedNonReleaseVersion._id)!
          const versionDisplay = getVersionDisplay(selectedNonReleaseVersion)
          return (
            <VersionChip
              key={selectedNonReleaseVersion._id}
              selected
              text={versionDisplay?.displayName ?? bundleId}
              tone={versionDisplay?.tone ?? 'default'}
              onClick={() => onSelectBundle(selectedNonReleaseVersion)}
              onCopyToDraftsNavigate={onCopyToDraftsNavigate}
              contextValues={{
                documentId: getPublishedId(selectedNonReleaseVersion._id),
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
          content={t(`release.chip.tooltip.other-${mode}`, {
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
            text={t(`release.chip.button.other-${mode}`, {count: otherNonReleaseVersions.length})}
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
            <Flex padding={3} gap={2} wrap="wrap">
              {otherNonReleaseVersions.map((nonReleaseVersion) => {
                const scopeId = nonReleaseVersion._system.scopeId!
                const selected = selectedPerspective === scopeId

                const versionDisplay = getVersionDisplay(nonReleaseVersion)
                return (
                  <VersionChip
                    key={nonReleaseVersion._id}
                    selected={selected}
                    text={versionDisplay?.displayName ?? scopeId}
                    disabled={false}
                    contextMenuPortal={false}
                    tone={versionDisplay?.tone ?? 'default'}
                    onClick={() => onSelectBundle(nonReleaseVersion)}
                    onCopyToDraftsNavigate={onCopyToDraftsNavigate}
                    contextValues={{
                      documentId: getPublishedId(nonReleaseVersion._id),
                      releases,
                      releasesLoading: releasesLoading,
                      documentType: documentType,
                      bundleId: scopeId,
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
