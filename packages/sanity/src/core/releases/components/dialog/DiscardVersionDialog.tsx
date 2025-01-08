import {Box} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useDocumentOperation, useSchema} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {Preview} from '../../../preview'
import {getPublishedId, getVersionFromId, isVersionId} from '../../../util/draftUtils'
import {usePerspective, useVersionOperations} from '../../hooks'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

/**
 * @internal
 */
export function DiscardVersionDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
}): React.JSX.Element {
  const {onClose, documentId, documentType} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {discardChanges} = useDocumentOperation(getPublishedId(documentId), documentType)

  const {selectedPerspective} = usePerspective()
  const {discardVersion} = useVersionOperations()
  const schema = useSchema()
  const [isDiscarding, setIsDiscarding] = useState(false)

  const schemaType = schema.get(documentType)

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)

    if (isVersionId(documentId)) {
      await discardVersion(
        getVersionFromId(documentId) ||
          getReleaseIdFromReleaseDocumentId((selectedPerspective as ReleaseDocument)._id),
        documentId,
      )
    } else {
      // on the document header you can also discard the draft
      discardChanges.execute()
    }

    setIsDiscarding(false)

    onClose()
  }, [selectedPerspective, discardChanges, discardVersion, documentId, onClose])

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
