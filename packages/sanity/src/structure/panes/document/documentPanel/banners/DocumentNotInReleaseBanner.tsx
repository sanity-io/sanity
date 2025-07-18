import {Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionInlineBadge,
  LATEST,
  type ReleaseDocument,
  Translate,
  useConditionalToast,
  useTranslation,
  useVersionOperations,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

// How long to wait after user hit the "Add to release"-button before displaying the "waiting…" toast
const TOAST_DELAY = 1000

type VersionCreateState = {
  status: 'creating' | 'created'
  lastUpdate: Date
}

export function DocumentNotInReleaseBanner({
  documentId,
  currentRelease,
  isScheduledRelease,
}: {
  documentId: string
  currentRelease: ReleaseDocument
  isScheduledRelease?: boolean
}): React.JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {createVersion} = useVersionOperations()

  const [versionCreateState, setVersionCreateState] = useState<VersionCreateState | undefined>()
  const toast = useToast()
  const handleAddToRelease = useCallback(async () => {
    if (currentRelease._id) {
      setVersionCreateState({status: 'creating', lastUpdate: new Date()})
      try {
        await createVersion(getReleaseIdFromReleaseDocumentId(currentRelease._id), documentId)
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
  }, [createVersion, currentRelease._id, documentId, t, toast])

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

  return (
    <Banner
      tone={tone}
      content={
        <Text size={1}>
          <Translate
            i18nKey="banners.release.not-in-release"
            t={t}
            values={{
              title:
                currentRelease?.metadata?.title || tCore('release.placeholder-untitled-release'),
            }}
            components={{
              VersionBadge: getVersionInlineBadge(currentRelease),
            }}
          />
        </Text>
      }
      // Adding to a scheduled release is not allowed
      action={
        isScheduledRelease
          ? undefined
          : {
              text: t('banners.release.action.add-to-release'),
              tone: tone,
              disabled: Boolean(versionCreateState),
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
