import {DocumentId, getPublishedId, getVersionNameFromId, isVersionId} from '@sanity/id-utils'
import {Box} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useDocumentOperation, useSchema} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {Preview} from '../../../preview'
import {useVersionOperations} from '../../hooks'
import {releasesLocaleNamespace} from '../../i18n'
import {ReleaseId} from '../../util/releaseId'

/**
 * @internal
 */
export function DiscardVersionDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
}): JSX.Element {
  const {onClose, documentType} = props
  const documentId = DocumentId(props.documentId)
  const {t} = useTranslation(releasesLocaleNamespace)
  const {discardChanges} = useDocumentOperation(getPublishedId(documentId), documentType)

  const {discardVersion} = useVersionOperations()
  const schema = useSchema()
  const [isDiscarding, setIsDiscarding] = useState(false)

  const schemaType = schema.get(documentType)

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)

    if (isVersionId(documentId)) {
      await discardVersion(ReleaseId(getVersionNameFromId(documentId)), documentId)
    } else {
      // on the document header you can also discard the draft
      discardChanges.execute()
    }

    setIsDiscarding(false)

    onClose()
  }, [discardChanges, discardVersion, documentId, onClose])

  return (
    <Dialog
      id={'discard-version-dialog'}
      header={t('discard-version-dialog.header')}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          disabled: isDiscarding,
          onClick: onClose,
        },
        confirmButton: {
          text: t('discard-version-dialog.title'),
          onClick: handleDiscardVersion,
          disabled: isDiscarding,
        },
      }}
    >
      <Box paddingX={3} marginBottom={2}>
        {schemaType ? (
          <Preview value={{_id: documentId}} schemaType={schemaType} />
        ) : (
          <LoadingBlock />
        )}
      </Box>
    </Dialog>
  )
}
