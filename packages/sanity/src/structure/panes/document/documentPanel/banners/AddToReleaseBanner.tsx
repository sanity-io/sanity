import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionInlineBadge,
  LATEST,
  type ReleaseDocument,
  Translate,
  useTranslation,
  useVersionOperations,
} from 'sanity'
import {structureLocaleNamespace} from 'sanity/structure'

import {Button} from '../../../../../ui-components'
import {useConditionalToast} from '../documentViews/useConditionalToast'
import {Banner} from './Banner'

// How long to wait after user hit the "Add to release"-button before displaying the "waiting…" toast
const TOAST_DELAY = 1000

type VersionCreateState = {
  status: 'creating' | 'created'
  lastUpdate: Date
}

export function AddToReleaseBanner({
  documentId,
  currentRelease,
  value,
}: {
  documentId: string
  currentRelease: ReleaseDocument
  value?: Record<string, unknown>
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
        await createVersion(
          getReleaseIdFromReleaseDocumentId(currentRelease._id),
          documentId,
          value,
        )
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
  }, [createVersion, currentRelease._id, documentId, t, toast, value])

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
      paddingY={0}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
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
          <Flex gap={2} align="center" justify="center">
            <Button
              text={t('banners.release.action.add-to-release')}
              tone={tone}
              disabled={Boolean(versionCreateState)}
              onClick={handleAddToRelease}
            />
          </Flex>
        </Flex>
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
