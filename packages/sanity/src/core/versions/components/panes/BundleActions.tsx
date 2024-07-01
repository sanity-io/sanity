import {AddIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient, useDocumentOperation} from 'sanity'

import {Button} from '../../../../ui-components'
import {type Version} from '../../types'
import {getAllVersionsOfDocument, versionDocumentExists} from '../../util/dummyGetters'

interface BundleActionsProps {
  currentVersion: Version
  documentId: string
  documentType: string
  isReady: boolean
}

export function BundleActions(props: BundleActionsProps): JSX.Element {
  const {currentVersion, documentId, documentType, isReady} = props
  const {name, title} = currentVersion

  const [documentVersions, setDocumentVersions] = useState<Version[]>([])
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {newVersion} = useDocumentOperation(documentId, documentType)

  const fetchVersions = useCallback(async () => {
    const response = await getAllVersionsOfDocument(client, documentId)
    setDocumentVersions(response)
  }, [client, documentId])

  // DUMMY FETCH -- NEEDS TO BE REPLACED -- USING GROQ from utils
  useEffect(() => {
    const fetchVersionsInner = async () => {
      fetchVersions()
    }

    fetchVersionsInner()
  }, [fetchVersions])

  const handleAddVersion = useCallback(() => {
    // only add to version if there isn't already a version in that bundle of this doc
    if (versionDocumentExists(documentVersions, name)) {
      toast.push({
        status: 'error',
        title: `There's already a version of this document in the bundle ${title}`,
      })
      return
    }

    const bundleId = `${name}.${documentId}`

    newVersion.execute(bundleId)
  }, [documentId, documentVersions, name, newVersion, title, toast])

  /* follow up
  const handleReady = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('handle ready', name)
  }, [name]) 
  
  isReady ? (
    {<Button
      data-testid={`action-ready-to-${name}`}
      // localize text
      // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
      text="Ready"
      icon={CheckmarkIcon}
      onClick={handleReady}
    />
  )*/

  // eslint-disable-next-line no-warning-comments
  /** TODO what should happen when you add a version if we don't have the ready button */

  return (
    <Button
      data-testid={`action-add-to-${name}`}
      // localize text
      // eslint-disable-next-line @sanity/i18n/no-attribute-template-literals
      text={`Add to ${title}`}
      icon={AddIcon}
      tone="primary"
      onClick={handleAddVersion}
    />
  )
}
