import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {getPublishedId, useDocumentOperation, useDocumentStore, useTranslation} from 'sanity'

import {Button} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {getBundleSlug} from '../../util/util'

interface BundleActionsProps {
  currentGlobalBundle: BundleDocument
  /**
   * The id of the document that is displayed in the form, might be a draft, a version, or the published one.
   * e.g: foo, drafts.foo, version.summer.foo
   */
  documentId: string
  documentType: string
  bundleSlug?: string
}

/**
 * @internal
 */
export function BundleActions(props: BundleActionsProps): ReactNode {
  const {currentGlobalBundle, documentType, documentId, bundleSlug} = props
  const publishedId = getPublishedId(documentId)

  const {slug, title, archivedAt} = currentGlobalBundle
  const documentStore = useDocumentStore()
  const [creatingVersion, setCreatingVersion] = useState<boolean>(false)
  const [isInVersion, setIsInVersion] = useState<boolean>(() => getBundleSlug(documentId) === slug)

  const toast = useToast()
  const {newVersion} = useDocumentOperation(publishedId, documentType, bundleSlug)
  const {t} = useTranslation()

  const handleAddVersion = useCallback(async () => {
    if (!documentId) {
      toast.push({
        status: 'error',
        title: "Can't add version without a base document",
      })
      return
    }
    // only add to version if there isn't already a version in that bundle of this doc
    if (getBundleSlug(documentId) === slug) {
      toast.push({
        status: 'error',
        title: `There's already a version of this document in the bundle ${title}`,
      })
      return
    }

    const bundleId = `versions.${slug}.${documentId}`

    setCreatingVersion(true)

    // set up the listener before executing
    const createVersionSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(bundleId, documentType)
        .pipe(filter((e) => e.op === 'newVersion' && e.type === 'success')),
    )

    newVersion.execute(bundleId)

    // only change if the version was created successfully
    await createVersionSuccess
    setIsInVersion(true)
  }, [documentId, slug, publishedId, documentStore.pair, documentType, newVersion, toast, title])

  /** TODO what should happen when you add a version if we don't have the ready button */

  if (archivedAt) return null

  return (
    <Button
      data-testid={`action-add-to-${slug}`}
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
