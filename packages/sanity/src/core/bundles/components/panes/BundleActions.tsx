import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  useClient,
  useDocumentOperation,
  useDocumentStore,
} from 'sanity'

import {Button} from '../../../../ui-components'
import {useBundles} from '../../../store/bundles/BundlesProvider'
import {type BundleDocument} from '../../../store/bundles/types'
import {getAllVersionsOfDocument, versionDocumentExists} from '../../util/dummyGetters'

interface BundleActionsProps {
  currentGlobalBundle: Partial<BundleDocument>
  documentId: string
  documentType: string
}

export function BundleActions(props: BundleActionsProps): JSX.Element {
  const {currentGlobalBundle, documentId, documentType} = props
  const {name, title} = currentGlobalBundle
  const {data: bundles, loading} = useBundles()
  const documentStore = useDocumentStore()

  const [documentVersions, setDocumentVersions] = useState<BundleDocument[]>([])
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [isInVersion, setIsInVersion] = useState(false)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {newVersion} = useDocumentOperation(documentId, documentType)

  const fetchVersions = useCallback(async () => {
    if (!loading) {
      const response = await getAllVersionsOfDocument(bundles, client, documentId)
      setDocumentVersions(response)
      setIsInVersion(versionDocumentExists(documentVersions, name))
    }
  }, [loading, bundles, client, documentId, documentVersions, name])

  // DUMMY FETCH -- NEEDS TO BE REPLACED -- USING GROQ from utils
  useEffect(() => {
    const fetchVersionsInner = async () => {
      fetchVersions()
    }

    fetchVersionsInner()
  }, [bundles, documentId, fetchVersions])

  const handleAddVersion = useCallback(async () => {
    // only add to version if there isn't already a version in that bundle of this doc
    if (versionDocumentExists(documentVersions, name)) {
      toast.push({
        status: 'error',
        title: `There's already a version of this document in the bundle ${title}`,
      })
      return
    }

    const bundleId = `${name}.${documentId}`

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
    name,
    newVersion,
    title,
    toast,
  ])

  /** TODO what should happen when you add a version if we don't have the ready button */

  return (
    <Button
      data-testid={`action-add-to-${name}`}
      // localize text
      text={isInVersion ? `Already in release ${title}` : `Add to ${title}`}
      icon={isInVersion ? CheckmarkIcon : AddIcon}
      tone="primary"
      onClick={handleAddVersion}
      disabled={isInVersion || creatingVersion}
    />
  )
}
