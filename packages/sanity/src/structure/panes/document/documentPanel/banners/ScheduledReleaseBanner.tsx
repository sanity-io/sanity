import {LockIcon} from '@sanity/icons/Lock'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  InsufficientPermissionsMessage,
  isCardinalityOneRelease,
  LATEST,
  type ReleaseDocument,
  Translate,
  useCurrentUser,
  useDocumentPairPermissions,
  useFormatRelativeLocalePublishDate,
  usePauseToEditScheduledDraft,
  useTranslation,
} from 'sanity'
import {Text, type TextProps} from 'ui5'

import {useDocumentTitle} from '../../useDocumentTitle'
import {Banner} from './Banner'

export function ScheduledReleaseBanner({
  currentRelease,
  documentId,
  documentType,
}: {
  currentRelease: ReleaseDocument
  documentId: string
  documentType: string
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

  const currentUser = useCurrentUser()
  const [publishPermission, isPublishPermissionLoading] = useDocumentPairPermissions({
    id: documentId,
    // '*' denies without a document lookup.
    type: isCardinalityOne ? documentType : '*',
    version: getReleaseIdFromReleaseDocumentId(currentRelease._id),
    permission: 'publish',
  })
  const isPublishGranted = Boolean(publishPermission?.granted)
  const isPublishDenied = !isPublishPermissionLoading && !isPublishGranted

  return (
    <Banner
      tone={tone}
      icon={LockIcon}
      data-testid="scheduled-release-banner"
      content={
        <Text size={1} as="div" trim={true} tone={tone as TextProps['tone']}>
          <Translate
            t={tCore}
            i18nKey="release.banner.scheduled-for-publishing-on"
            values={{
              date: formatPublishDate(currentRelease),
            }}
          />
        </Text>
      }
      action={
        isCardinalityOne
          ? {
              text: tCore('release.action.pause-to-edit'),
              onClick: pauseToEdit,
              disabled: isPausing || isPublishPermissionLoading || !isPublishGranted,
              tooltipProps: isPublishDenied
                ? {
                    content: (
                      <InsufficientPermissionsMessage
                        context="edit-schedules"
                        currentUser={currentUser}
                      />
                    ),
                  }
                : null,
              mode: 'default',
              tone: tone,
            }
          : undefined
      }
    />
  )
}
