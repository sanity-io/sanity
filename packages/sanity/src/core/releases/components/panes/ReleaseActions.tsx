import {AddIcon, TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getCreateVersionOrigin,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isVersionId,
  Translate,
  useClient,
  useDocumentOperation,
  useDocumentStore,
  useTranslation,
} from 'sanity'

import {Button} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {AddedVersion} from '../../__telemetry__/releases.telemetry'

interface ReleaseActionsProps {
  currentGlobalBundle: BundleDocument
  /**
   * The id of the document that is displayed in the form, might be a draft, a version, or the published one.
   * e.g: foo, drafts.foo, version.summer.foo
   */
  documentId: string
  documentType: string
  bundleId?: string
}

/**
 * @internal
 */
export function ReleaseActions(props: ReleaseActionsProps): ReactNode {
  const {currentGlobalBundle, documentType, documentId, bundleId} = props
  const publishedId = getPublishedId(documentId)

  const {_id: globalBundleId, title, archivedAt} = currentGlobalBundle
  const documentStore = useDocumentStore()
  const [creatingVersion, setCreatingVersion] = useState<boolean>(false)
  const [isInVersion, setIsInVersion] = useState<boolean>(
    () => getVersionFromId(documentId) === globalBundleId,
  )
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false)

  const toast = useToast()
  const {createVersion} = useDocumentOperation(publishedId, documentType, bundleId)
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const handleAddVersion = useCallback(async () => {
    if (!documentId) {
      toast.push({
        status: 'error',
        title: "Can't add version without a base document",
      })
      return
    }
    // only add to version if there isn't already a version in that bundle of this doc
    if (getVersionFromId(documentId) === globalBundleId) {
      toast.push({
        status: 'error',
        title: `There's already a version of this document in the bundle ${title}`,
      })
      return
    }

    const versionId = getVersionId(documentId, globalBundleId)

    setCreatingVersion(true)

    // set up the listener before executing
    const createVersionSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(getPublishedId(documentId), documentType)
        .pipe(filter((e) => e.op === 'createVersion' && e.type === 'success')),
    )

    const origin = getCreateVersionOrigin(documentId)

    createVersion.execute(versionId, origin)

    // only change if the version was created successfully
    await createVersionSuccess
    setIsInVersion(true)

    telemetry.log(AddedVersion, {
      schemaType: documentType,
      documentOrigin: isVersionId(documentId) ? 'version' : 'draft',
    })
  }, [
    documentId,
    globalBundleId,
    documentStore.pair,
    documentType,
    createVersion,
    telemetry,
    toast,
    title,
  ])

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)
    try {
      // TODO: should we use the document operations for this?
      await client.delete(documentId)

      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey={'release.action.discard-version.success'}
            values={{title: document.title as string}}
          />
        ),
      })

      setIsInVersion(false)
    } catch (e) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.discard-version.failure'),
      })
    }

    setIsDiscarding(false)
  }, [client, documentId, t, toast])

  if (archivedAt) return null

  const bundleActionButtonProps = isInVersion
    ? {
        text: t('release.action.discard-version', {title}),
        icon: TrashIcon,
        tone: 'caution' as const,
        onClick: handleDiscardVersion,
      }
    : {
        text: t('release.action.add-to-release', {title}),
        icon: AddIcon,
        tone: 'primary' as const,
        onClick: handleAddVersion,
      }

  return (
    <Button
      {...bundleActionButtonProps}
      data-testid={`action-add-to-${globalBundleId}`}
      loading={creatingVersion || isDiscarding}
    />
  )
}
