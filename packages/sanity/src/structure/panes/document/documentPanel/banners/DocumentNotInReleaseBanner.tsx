import {Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  isAgentBundleName,
  LATEST,
  RELEASES_INTENT,
  ReleaseTitle,
  type SystemBundle,
  type TargetPerspective,
  Translate,
  useConditionalToast,
  useTranslation,
  useVersionOperations,
  ReleaseAvatarIcon,
  useCurrentLocale,
  VersionInlineBadge,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

// How long to wait after user hit the "Add to release"-button before displaying the "waiting…" toast
const TOAST_DELAY = 1000

type VersionCreateState = {
  status: 'creating' | 'created'
  lastUpdate: Date
}

/** A chip and the word before it ("release", "on"), on one line: a line never breaks between them (Chrome breaks before an inline chip even after a non-breaking space). */
function WithLead({lead, children}: {lead?: string; children: ReactNode}) {
  if (!lead) return <>{children}</>
  return (
    <span style={{whiteSpace: 'nowrap'}}>
      {lead}
      {'\u00a0'}
      {children}
    </span>
  )
}

function VersionBadge({
  children,
  currentRelease,
  fallbackTitle,
  releaseLead,
}: {
  releaseLead?: string
  children?: React.ReactNode
  currentRelease?: Exclude<TargetPerspective, SystemBundle>
  fallbackTitle?: string
}) {
  const tone = getReleaseTone(currentRelease ?? LATEST)
  // PROPOSED: the chip carries the release's glyph (its bolt, clock or dot), as the release menus do. It is the release's name only:
  // a date is its own chip in the sentence (it is set elsewhere).
  const icon = <ReleaseAvatarIcon release={currentRelease ?? LATEST} />
  if (typeof currentRelease === 'string' || !currentRelease) {
    return (
      <WithLead lead={releaseLead}>
        <VersionInlineBadge $tone={tone} icon={icon}>
          {children}
        </VersionInlineBadge>
      </WithLead>
    )
  }
  return (
    <ReleaseTitle title={currentRelease.metadata?.title} fallback={fallbackTitle ?? ''}>
      {() => (
        <WithLead lead={releaseLead}>
          <VersionInlineBadge $tone={tone} icon={icon}>
            {children}
          </VersionInlineBadge>
        </WithLead>
      )}
    </ReleaseTitle>
  )
}

/** A date in the banner's sentence: a neutral display chip, set elsewhere (the release's schedule). */
function DateBadge({children, dateLead}: {children?: ReactNode; dateLead?: string}) {
  return (
    <WithLead lead={dateLead}>
      <VersionInlineBadge $tone="default">{children}</VersionInlineBadge>
    </WithLead>
  )
}

export function DocumentNotInReleaseBanner({
  documentId,
  currentRelease,
  isScheduledRelease,
}: {
  documentId: string
  currentRelease: Exclude<TargetPerspective, SystemBundle>
  isScheduledRelease?: boolean
}) {
  const tone = getReleaseTone(currentRelease ?? LATEST)
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {createVersion} = useVersionOperations()
  const {navigateIntent} = useRouter()

  const isAnonymousBundle = typeof currentRelease === 'string'
  const releaseTitle = isAnonymousBundle
    ? currentRelease
    : currentRelease?.metadata?.title || tCore('release.placeholder-untitled-release')
  const [versionCreateState, setVersionCreateState] = useState<VersionCreateState | undefined>()
  const toast = useToast()
  const handleAddToRelease = useCallback(async () => {
    if (isAnonymousBundle || currentRelease._id) {
      setVersionCreateState({status: 'creating', lastUpdate: new Date()})

      const bundleId = isAnonymousBundle
        ? currentRelease
        : getReleaseIdFromReleaseDocumentId(currentRelease._id)

      try {
        // PROPOSED: in place: the studio already shows this release, so there is nowhere to go.
        await createVersion(bundleId, documentId, {navigate: false})
        setVersionCreateState({status: 'created', lastUpdate: new Date()})
      } catch (err) {
        toast.push({
          status: 'error',
          closable: true,
          title: t('banners.release.error.title'),
          description: t('banners.release.error.description', {message: err.message}),
        })
        // Note: we only want to reset pending state in case of failure, not unconditionally the request completes (i.e. in a finally clause)
        // this is because the UI won't reflect that the document was successfully added to the release until we get the result back over the listener
        // once the listener event that adds the document to the release arrives the UI knows that a version exists,
        // and this banner will not be rendered anymore
        setVersionCreateState(undefined)
      }
    }
  }, [createVersion, currentRelease, isAnonymousBundle, documentId, t, toast])

  const now = useCurrentTime(200)

  useConditionalToast({
    status: 'info',
    id: 'add-document-to-release',
    enabled: Boolean(
      versionCreateState?.status === 'created' &&
      now.getTime() - versionCreateState.lastUpdate.getTime() > TOAST_DELAY,
    ),
    closable: true,
    title: t('banners.release.waiting.title'),
    description: t('banners.release.waiting.description'),
  })

  const releaseKind =
    typeof currentRelease === 'object' ? currentRelease?.metadata.releaseType : undefined
  // The locked release's publish date and time, in the Studio's locale, for its own chip in the sentence.
  const locale = useCurrentLocale().id
  const publishAtIso =
    typeof currentRelease === 'object'
      ? (currentRelease?.publishAt ?? currentRelease?.metadata.intendedPublishAt)
      : undefined
  const publishAt = publishAtIso
    ? new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(publishAtIso))
    : ''

  return (
    <Banner
      // PROPOSED: release banners are neutral; the release chip and the button keep the release tone (Faheem, 23 Oct).
      tone="neutral"
      content={
        <Text size={1}>
          <Translate
            // PROPOSED: a scheduled release says why nothing can be added, and where to go (Unschedule is in the Releases tool).
            // PROPOSED: the release's kind is a word in the sentence ("the ASAP release", "the undecided release"); the chip is its identity.
            i18nKey={
              isScheduledRelease
                ? 'banners.release.scheduled-locked'
                : releaseKind === 'asap'
                  ? 'banners.release.not-in-release-asap'
                  : releaseKind === 'undecided'
                    ? 'banners.release.not-in-release-undecided'
                    : 'banners.release.not-in-release'
            }
            t={t}
            values={{
              title: releaseTitle,
              date: publishAt,
            }}
            components={{VersionBadge, DateBadge}}
            componentProps={{
              currentRelease,
              fallbackTitle: tCore('release.placeholder-untitled-release'),
              releaseLead: t('banners.release.lead.release'),
              dateLead: t('banners.release.lead.on'),
            }}
          />
        </Text>
      }
      // Adding to a scheduled release is not allowed. PROPOSED: its banner opens the release instead, where it can be unscheduled.
      action={
        isScheduledRelease
          ? isAnonymousBundle
            ? undefined
            : {
                text: t('banners.release.action.open-release'),
                mode: 'ghost',
                onClick: () =>
                  navigateIntent(RELEASES_INTENT, {
                    id: getReleaseIdFromReleaseDocumentId(currentRelease._id),
                  }),
              }
          : {
              text: isAgentBundleName(currentRelease)
                ? t('banners.release.action.add-to-bundle')
                : t('banners.release.action.add-to-release'),
              tone: tone,
              disabled: Boolean(versionCreateState),
              // PROPOSED: the button says it is working until the version arrives and the banner goes.
              ...(versionCreateState ? {text: t('banners.release.action.adding')} : {}),
              onClick: handleAddToRelease,
              mode: 'default',
            }
      }
    />
  )
}

function useCurrentTime(updateIntervalMs: number): Date {
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, updateIntervalMs)
    return () => clearInterval(intervalId)
  }, [updateIntervalMs])
  return currentTime
}
