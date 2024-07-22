import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {useDocumentOperation, useDocumentStore, useDocumentVersions} from 'sanity'

import {Button} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {versionDocumentExists} from '../../util/dummyGetters'

interface BundleActionsProps {
  currentGlobalBundle: BundleDocument
  documentId: string
  documentType: string
}

/**
 * @internal
 */
export function BundleActions(props: BundleActionsProps): JSX.Element {
  const {currentGlobalBundle, documentId, documentType} = props
  const {slug, title} = currentGlobalBundle
  const {data: documentVersions} = useDocumentVersions({documentId})
  const documentStore = useDocumentStore()

  const [creatingVersion, setCreatingVersion] = useState<boolean>(false)
  const [isInVersion, setIsInVersion] = useState<boolean>(false)

  const toast = useToast()
  const {newVersion} = useDocumentOperation(documentId, documentType)

  useEffect(() => {
    if (documentVersions) {
      const exists = versionDocumentExists(documentVersions, slug) ?? false
      setIsInVersion(exists)
    }
  }, [documentVersions, slug])

  const handleAddVersion = useCallback(async () => {
    // only add to version if there isn't already a version in that bundle of this doc
    if (documentVersions && versionDocumentExists(documentVersions, slug)) {
      toast.push({
        status: 'error',
        title: `There's already a version of this document in the bundle ${title}`,
      })
      return
    }

    const bundleId = `${slug}.${documentId}`

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
  }, [
    documentId,
    documentStore.pair,
    documentType,
    documentVersions,
    slug,
    newVersion,
    title,
    toast,
  ])

  /** TODO what should happen when you add a version if we don't have the ready button */

  return (
    <Button
      data-testid={`action-add-to-${slug}`}
      // localize text
      text={isInVersion ? `Already in release ${title}` : `Add to ${title}`}
      icon={isInVersion ? CheckmarkIcon : AddIcon}
      tone="primary"
      onClick={handleAddVersion}
      disabled={isInVersion || creatingVersion}
      loading={!documentVersions}
    />
  )
}
