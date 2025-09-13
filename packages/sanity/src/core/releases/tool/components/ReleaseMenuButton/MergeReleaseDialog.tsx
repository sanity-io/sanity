import {type ReleaseDocument} from '@sanity/client'
import {ChevronDownIcon, LockIcon, TransferIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Menu, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useId} from 'react'
import {styled} from 'styled-components'

import {Dialog, MenuButton, MenuItem, Tooltip} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {ReleaseAvatar} from '../../../components/ReleaseAvatar'
import {getVersionInlineBadge} from '../../../components/VersionInlineBadge'
import {releasesLocaleNamespace} from '../../../i18n'
import {useActiveReleases} from '../../../store/useActiveReleases'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {formatRelativeLocalePublishDate, isReleaseScheduledOrScheduling} from '../../../util/util'
import {useBundleDocuments} from '../../detail/useBundleDocuments'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

const InlineBadgeWrapper = styled.span`
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  font-weight: inherit;
`

// Helper function to extract base document ID from versioned ID
const getBaseDocumentId = (documentId: string): string => {
  const parts = documentId.split('.')
  return parts[parts.length - 1]
}

// Component for individual release menu items
const MergeReleaseMenuItem = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation()
  const isScheduled = isReleaseScheduledOrScheduling(release)

  return (
    <Flex gap={3} justify="center" align="center">
      <ReleaseAvatar padding={2} tone={getReleaseTone(release)} />
      <Stack flex={1} space={2}>
        <Text size={1} weight="medium">
          {release.metadata?.title || t('release.placeholder-untitled-release')}
        </Text>
        <Text muted size={1}>
          {release.metadata.releaseType === 'asap' && t('release.type.asap')}
          {release.metadata.releaseType === 'scheduled' &&
            (release.metadata.intendedPublishAt
              ? formatRelativeLocalePublishDate(release)
              : t('release.chip.tooltip.unknown-date'))}
          {release.metadata.releaseType === 'undecided' && t('release.type.undecided')}
        </Text>
      </Stack>
      {isScheduled && <LockIcon />}
    </Flex>
  )
}

// Component for the release selector dropdown
const ReleaseSelector = ({
  release,
  availableReleases,
  onSelect,
  placeholder,
  menuButtonId,
}: {
  release: ReleaseDocument | null | undefined
  availableReleases: ReleaseDocument[]
  onSelect: (releaseId: string) => void
  placeholder: string
  menuButtonId: string
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <MenuButton
      id={menuButtonId}
      button={
        <Button mode="ghost" style={{width: '100%'}}>
          <Flex justify="space-between" align="center" gap={2} style={{width: '100%'}}>
            <Box style={{minWidth: 0, flex: 1}}>
              <Text size={1} muted={!release} textOverflow="ellipsis">
                {release?.metadata.title || placeholder}
              </Text>
            </Box>
            <ChevronDownIcon />
          </Flex>
        </Button>
      }
      popover={{
        placement: 'bottom',
        matchReferenceWidth: true,
      }}
      menu={
        <Menu>
          <ReleasesList space={1}>
            {availableReleases.map((r) => {
              const releaseId = getReleaseIdFromReleaseDocumentId(r._id)
              const isScheduled = r.metadata.releaseType === 'scheduled'

              return (
                <MenuItem
                  key={r._id}
                  onClick={() => !isScheduled && onSelect(releaseId)}
                  disabled={isScheduled}
                  tooltipProps={
                    isScheduled ? {content: t('merge-dialog.unschedule-tooltip')} : undefined
                  }
                  renderMenuItem={() => <MergeReleaseMenuItem release={r} />}
                />
              )
            })}
          </ReleasesList>
        </Menu>
      }
    />
  )
}

// Component for the conflict warning card
const ConflictWarning: React.FC<{
  conflictCount: number
  targetRelease: ReleaseDocument
  isLoading: boolean
}> = ({conflictCount, targetRelease, isLoading}) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  if (isLoading) {
    return (
      <Card tone="transparent" padding={3} radius={2}>
        <Flex align="center" gap={2}>
          <Spinner />
          <Text size={1} muted>
            {t('merge-dialog.checking-documents')}
          </Text>
        </Flex>
      </Card>
    )
  }

  if (conflictCount === 0) return null

  const ToBadge = getVersionInlineBadge(targetRelease)

  return (
    <Card tone="caution" padding={3} radius={2}>
      <Text size={1}>
        <Translate
          t={t}
          i18nKey="merge-dialog.conflict-warning"
          values={{count: conflictCount}}
          components={{
            VersionBadge: () => (
              <InlineBadgeWrapper>
                <ToBadge>{targetRelease.metadata.title}</ToBadge>
              </InlineBadgeWrapper>
            ),
          }}
        />
      </Text>
    </Card>
  )
}

const MergeDescription: React.FC<{
  fromRelease: ReleaseDocument
  toRelease: ReleaseDocument
  swapped: boolean
}> = ({fromRelease, toRelease, swapped}) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  const actualFromRelease = swapped ? toRelease : fromRelease
  const actualToRelease = swapped ? fromRelease : toRelease

  const FromBadge = getVersionInlineBadge(actualFromRelease)
  const ToBadge = getVersionInlineBadge(actualToRelease)

  return (
    <Text size={1} muted>
      <Translate
        t={t}
        i18nKey="merge-dialog.description"
        components={{
          FromBadge: () => (
            <InlineBadgeWrapper>
              <FromBadge>{actualFromRelease.metadata.title}</FromBadge>
            </InlineBadgeWrapper>
          ),
          ToBadge: () => (
            <InlineBadgeWrapper>
              <ToBadge>{actualToRelease.metadata.title}</ToBadge>
            </InlineBadgeWrapper>
          ),
        }}
      />
    </Text>
  )
}

interface MergeReleaseDialogProps {
  release: ReleaseDocument
  onClose: () => void
  onConfirm: (fromReleaseId: string, toReleaseId: string) => void
  isPerformingOperation: boolean
}

export const MergeReleaseDialog: React.FC<MergeReleaseDialogProps> = ({
  release,
  onClose,
  onConfirm,
  isPerformingOperation,
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {data: releases} = useActiveReleases()
  const menuButtonId = useId()
  const menuButtonSwappedId = useId()

  const currentReleaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const [toReleaseId, setToReleaseId] = useState<string | null>(null)
  const [swapped, setSwapped] = useState(false)

  // Get available releases for selection (exclude current and selected releases)
  const availableReleases = useMemo(
    () =>
      releases.filter((r) => {
        const releaseId = getReleaseIdFromReleaseDocumentId(r._id)
        return releaseId !== currentReleaseId && (!toReleaseId || releaseId !== toReleaseId)
      }),
    [releases, currentReleaseId, toReleaseId],
  )

  // Get release objects
  const fromRelease = useMemo(
    () => releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === currentReleaseId),
    [releases, currentReleaseId],
  )

  const toRelease = useMemo(
    () =>
      toReleaseId
        ? releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === toReleaseId)
        : null,
    [releases, toReleaseId],
  )

  // Get documents for conflict detection
  const {results: fromDocuments, loading: fromLoading} = useBundleDocuments(currentReleaseId)
  const {results: toDocuments, loading: toLoading} = useBundleDocuments(toReleaseId || '')

  // Determine if we're still loading documents
  const isLoadingDocuments = toReleaseId ? fromLoading || toLoading : false

  // Calculate conflicting documents using reduce
  const conflictCount = useMemo(() => {
    if (!toReleaseId || !fromDocuments.length || !toDocuments.length) return 0

    const toDocBaseIds = new Set(toDocuments.map((doc) => getBaseDocumentId(doc.document._id)))

    return fromDocuments.reduce((count, doc) => {
      const baseId = getBaseDocumentId(doc.document._id)
      return toDocBaseIds.has(baseId) ? count + 1 : count
    }, 0)
  }, [fromDocuments, toDocuments, toReleaseId])

  // Handlers
  const handleSwap = useCallback(() => setSwapped((prev) => !prev), [])

  const handleReleaseSelect = useCallback((releaseId: string) => {
    setToReleaseId(releaseId)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!toReleaseId) return

    // Swap the merge direction if swapped
    const [from, to] = swapped ? [toReleaseId, currentReleaseId] : [currentReleaseId, toReleaseId]

    onConfirm(from, to)
  }, [currentReleaseId, toReleaseId, onConfirm, swapped])

  // Create version badge for the fixed release
  const FromBadge = useMemo(() => {
    return getVersionInlineBadge(fromRelease)
  }, [fromRelease])

  return (
    <Dialog
      id="merge-release-dialog"
      data-testid="merge-release-dialog"
      header={t('merge-dialog.header')}
      onClose={onClose}
      onClickOutside={onClose}
      padding={false}
      width={1}
      footer={{
        confirmButton: {
          text: t('merge-dialog.confirm-button'),
          tone: 'primary',
          onClick: handleConfirm,
          loading: isPerformingOperation,
          disabled: isPerformingOperation || !toReleaseId,
        },
        cancelButton: {
          disabled: isPerformingOperation,
        },
      }}
    >
      <Stack space={4} paddingX={4} paddingY={4}>
        <Flex gap={3} align="center">
          {!swapped ? (
            <>
              <Text size={1}>
                <InlineBadgeWrapper>
                  <FromBadge>
                    {fromRelease?.metadata.title || t('release-placeholder.title')}
                  </FromBadge>
                </InlineBadgeWrapper>
              </Text>
              <Text size={1} muted>
                {t('merge-dialog.into')}
              </Text>
              <Box flex={1}>
                <ReleaseSelector
                  release={toRelease}
                  availableReleases={availableReleases}
                  onSelect={handleReleaseSelect}
                  placeholder={t('merge-dialog.select-release')}
                  menuButtonId={menuButtonId}
                />
              </Box>
            </>
          ) : (
            <>
              <Box flex={1}>
                <ReleaseSelector
                  release={toRelease}
                  availableReleases={availableReleases}
                  onSelect={handleReleaseSelect}
                  placeholder={t('merge-dialog.select-release')}
                  menuButtonId={menuButtonSwappedId}
                />
              </Box>
              <Text size={1} muted>
                {t('merge-dialog.into')}
              </Text>
              <Text size={1}>
                <InlineBadgeWrapper>
                  <FromBadge>
                    {fromRelease?.metadata.title || t('release-placeholder.title')}
                  </FromBadge>
                </InlineBadgeWrapper>
              </Text>
            </>
          )}
          <Tooltip content={t('merge-dialog.swap-tooltip')}>
            <Button icon={TransferIcon} mode="ghost" onClick={handleSwap} />
          </Tooltip>
        </Flex>

        {toRelease && fromRelease && (
          <>
            <ConflictWarning
              conflictCount={conflictCount}
              targetRelease={swapped ? fromRelease : toRelease}
              isLoading={isLoadingDocuments}
            />
            <MergeDescription fromRelease={fromRelease} toRelease={toRelease} swapped={swapped} />
          </>
        )}
      </Stack>
    </Dialog>
  )
}
