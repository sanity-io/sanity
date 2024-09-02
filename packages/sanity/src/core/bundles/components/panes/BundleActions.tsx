import {AddIcon, TrashIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  Translate,
  useClient,
  useDocumentOperation,
  useDocumentStore,
  useTranslation,
} from 'sanity'

import {Button} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'

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
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false)

  const toast = useToast()
  const {newVersion} = useDocumentOperation(publishedId, documentType, bundleId)
  const {t} = useTranslation()
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
        .operationEvents(versionId, documentType)
        .pipe(filter((e) => e.op === 'newVersion' && e.type === 'success')),
    )

    newVersion.execute(versionId)

    // only change if the version was created successfully
    await createVersionSuccess
    setIsInVersion(true)
  }, [documentId, globalBundleId, documentStore.pair, documentType, newVersion, toast, title])

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)
    try {
      await client.delete(documentId)

      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey={'bundle.action.discard-version.success'}
            values={{title: document.title as string}}
          />
        ),
      })

      setIsInVersion(false)
    } catch (e) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('bundle.action.discard-version.failure'),
      })
    }

    setIsDiscarding(false)
  }, [client, documentId, t, toast])

  if (archivedAt) return null

  return (
    <Button
      data-testid={`action-add-to-${globalBundleId}`}
      text={
        isInVersion
          ? t('bundle.action.discard-version', {title})
          : t('bundle.action.add-to-release', {title})
      }
      icon={isInVersion ? TrashIcon : AddIcon}
      tone={isInVersion ? 'caution' : 'primary'}
      onClick={isInVersion ? handleDiscardVersion : handleAddVersion}
      loading={creatingVersion || isDiscarding}
    />
  )
}
