import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isVersionId,
  useDocumentOperation,
  useDocumentStore,
  useTranslation,
} from 'sanity'

import {Button} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {AddedVersion} from '../../__telemetry__/bundles.telemetry'

interface BundleActionsProps {
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
export function BundleActions(props: BundleActionsProps): ReactNode {
  const {currentGlobalBundle, documentType, documentId, bundleId} = props
  const publishedId = getPublishedId(documentId)

  const {_id: globalBundleId, title, archivedAt} = currentGlobalBundle
  const documentStore = useDocumentStore()
  const [creatingVersion, setCreatingVersion] = useState<boolean>(false)
  const [isInVersion, setIsInVersion] = useState<boolean>(
    () => getVersionFromId(documentId) === globalBundleId,
  )

  const toast = useToast()
  const {newVersion} = useDocumentOperation(publishedId, documentType, bundleId)
  const {t} = useTranslation()
  const telemetry = useTelemetry()

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
        .pipe(filter((e) => e.op === 'newVersion' && e.type === 'success')),
    )

    newVersion.execute(versionId)

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
    bundleId,
    documentType,
    newVersion,
    telemetry,
    toast,
    title,
  ])

  /** TODO what should happen when you add a version if we don't have the ready button */

  if (archivedAt) return null

  return (
    <Button
      data-testid={`action-add-to-${globalBundleId}`}
      text={
        isInVersion
          ? t('bundle.action.already-in-release', {title})
          : t('bundle.action.add-to-release', {title})
      }
      icon={isInVersion ? CheckmarkIcon : AddIcon}
      tone="primary"
      onClick={handleAddVersion}
      disabled={isInVersion || creatingVersion}
    />
  )
}
