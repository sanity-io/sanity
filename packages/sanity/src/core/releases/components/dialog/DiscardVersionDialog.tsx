import {Box, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useDocumentOperation, useSchema} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {Preview, unstable_useValuePreview as useValuePreview} from '../../../preview'
import {getPublishedId, getVersionFromId, isVersionId} from '../../../util/draftUtils'
import {useVersionOperations} from '../../hooks'
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
  const {t: coreT} = useTranslation()
  const {discardChanges} = useDocumentOperation(getPublishedId(documentId), documentType)
  const toast = useToast()
  const {selectedPerspective} = usePerspective()
  const {discardVersion} = useVersionOperations()
  const schema = useSchema()
  const [isDiscarding, setIsDiscarding] = useState(false)

  const schemaType = schema.get(documentType)

  const preview = useValuePreview({schemaType, value: {_id: documentId}})

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)

    if (isVersionId(documentId)) {
      await discardVersion(
        getVersionFromId(documentId) ||
          getReleaseIdFromReleaseDocumentId((selectedPerspective as ReleaseDocument)._id),
        documentId,
      )

      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={coreT}
            i18nKey={'release.action.discard-version.success'}
            values={{title: preview.value?.title || documentId}}
          />
        ),
      })
    } else {
      // on the document header you can also discard the draft
      discardChanges.execute()
    }

    setIsDiscarding(false)

    onClose()
  }, [
    documentId,
    onClose,
    discardVersion,
    selectedPerspective,
    toast,
    coreT,
    preview.value?.title,
    discardChanges,
  ])

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
      <Stack space={3} paddingX={3} marginBottom={2}>
        {schemaType ? (
          <Preview value={{_id: documentId}} schemaType={schemaType} />
        ) : (
          <LoadingBlock />
        )}
        <Box paddingX={2}>
          <Text size={1} muted>
            {t('discard-version-dialog.description')}
          </Text>
        </Box>
      </Stack>
    </Dialog>
  )
}
