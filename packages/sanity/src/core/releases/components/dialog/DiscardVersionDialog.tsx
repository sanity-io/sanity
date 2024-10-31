import {Box} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useSchema} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {Preview} from '../../../preview'
import {useVersionOperations} from '../../hooks'
import {releasesLocaleNamespace} from '../../i18n'

/**
 * @internal
 */
export function DiscardVersionDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
}): JSX.Element {
  const {onClose, documentId, documentType} = props
  const {t} = useTranslation(releasesLocaleNamespace)

  const {discardVersion} = useVersionOperations(documentId, documentType)
  const schema = useSchema()
  const [isDiscarding, setIsDiscarding] = useState(false)

  const schemaType = schema.get(documentType)

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)

    discardVersion()
    setIsDiscarding(false)

    onClose()
  }, [discardVersion, onClose])

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
