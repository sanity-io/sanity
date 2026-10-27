import {LockIcon} from '@sanity/icons/Lock'
import {Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {
  getReleaseTone,
  isCardinalityOneRelease,
  LATEST,
  type ReleaseDocument,
  Translate,
  useFormatRelativeLocalePublishDate,
  usePauseToEditScheduledDraft,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'

import {useDocumentTitle} from '../../useDocumentTitle'
import {Banner} from './Banner'

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

/** A date in the banner's sentence: a neutral display chip, set elsewhere (the schedule). */
function DateBadge({children, dateLead}: {children?: ReactNode; dateLead?: string}) {
  return (
    <WithLead lead={dateLead}>
      <VersionInlineBadge $tone="default">{children}</VersionInlineBadge>
    </WithLead>
  )
}

export function ScheduledReleaseBanner({
  currentRelease,
}: {
  currentRelease: ReleaseDocument
}): React.JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)

  const {t: tCore} = useTranslation()
  const formatPublishDate = useFormatRelativeLocalePublishDate()
  const {title} = useDocumentTitle()
  const isCardinalityOne = isCardinalityOneRelease(currentRelease)
  const {pauseToEdit, isPausing} = usePauseToEditScheduledDraft({
    release: isCardinalityOne ? currentRelease : undefined,
    documentTitle: title,
  })

  return (
    <Banner
      tone={tone}
      icon={LockIcon}
      data-testid="scheduled-release-banner"
      content={
        <Text size={1}>
          <Translate
            t={tCore}
            // PROPOSED: a scheduled draft says when it publishes, as a chip, and how to edit it (its action pauses the schedule).
            i18nKey={
              isCardinalityOne
                ? 'release.banner.scheduled-draft'
                : 'release.banner.scheduled-for-publishing-on'
            }
            values={{
              date: formatPublishDate(currentRelease),
            }}
            components={{DateBadge}}
            componentProps={{dateLead: tCore('release.banner.lead.on')}}
          />
        </Text>
      }
      action={
        isCardinalityOne
          ? {
              text: tCore('release.action.pause-to-edit'),
              onClick: pauseToEdit,
              disabled: isPausing,
              mode: 'default',
              // PROPOSED: a banner's filled button is the primary tone in every banner, whatever the release's tone (the chip carries that).
              tone: 'primary',
            }
          : undefined
      }
    />
  )
}
