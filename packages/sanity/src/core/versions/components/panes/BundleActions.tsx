import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import {useCallback} from 'react'
import {useDocumentOperation} from 'sanity'

import {type Version} from '../../types'

interface BundleActionsProps {
  currentVersion: Version
  documentId: string
  documentType: string
  isReady: boolean
}

export function BundleActions(props: BundleActionsProps): JSX.Element {
  const {currentVersion, documentId, documentType, isReady} = props

  const {name, title} = currentVersion
  const {newVersion} = useDocumentOperation(documentId, documentType)

  const handleAddVersion = useCallback(() => {
    const bundleId = `${name}.${documentId}`

    newVersion.execute(bundleId)
  }, [documentId, name, newVersion])

  const handleReady = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('handle ready', name)
  }, [name])

  return isReady ? (
    <Button
      data-testid={`action-ready-to-${name}`}
      // localize text
      // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
      text="Ready"
      icon={CheckmarkIcon}
      onClick={handleReady}
    />
  ) : (
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
