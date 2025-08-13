import {type ReleaseDocument} from '@sanity/client'
import {Box, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useDocumentOperation} from '../../../hooks/useDocumentOperation'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {type SelectedPerspective} from '../../../perspective/types'
import {usePerspective} from '../../../perspective/usePerspective'
import {Preview} from '../../../preview/components/Preview'
import {getPublishedId, getVersionFromId, isDraftId, isVersionId} from '../../../util/draftUtils'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
/**
 * @internal
 */
export function DiscardVersionDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
  fromPerspective: string | SelectedPerspective
}): React.JSX.Element {
  const {onClose, documentId, documentType, fromPerspective} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: coreT} = useTranslation()
  const {discardChanges} = useDocumentOperation(getPublishedId(documentId), documentType)
  const {selectedPerspective} = usePerspective()
  const {discardVersion} = useVersionOperations()
  const schema = useSchema()
  const toast = useToast()
  const [isDiscarding, setIsDiscarding] = useState(false)
  const discardType = isDraftId(documentId) ? 'draft' : 'release'
  const releaseName =
    typeof fromPerspective === 'string' ? fromPerspective : fromPerspective.metadata.title

  const schemaType = schema.get(documentType)

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)

    if (isVersionId(documentId)) {
      try {
        await discardVersion(
          getVersionFromId(documentId) ||
            getReleaseIdFromReleaseDocumentId((selectedPerspective as ReleaseDocument)._id),
          documentId,
        )
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: coreT('release.action.discard-version.failure'),
          description: err.message,
        })
      }
    } else {
      // on the document header you can also discard the draft
      discardChanges.execute()
    }

    setIsDiscarding(false)

    onClose()
  }, [documentId, onClose, discardVersion, selectedPerspective, toast, coreT, discardChanges])

  return (
    <Dialog
      id={'discard-version-dialog'}
      header={
        <Translate
          t={t}
          i18nKey={`discard-version-dialog.header-${discardType}`}
          values={{releaseTitle: releaseName}}
        />
      }
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          disabled: isDiscarding,
          onClick: onClose,
        },
        confirmButton: {
          text: t(`discard-version-dialog.title-${discardType}`),
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
            <Translate
              t={t}
              i18nKey={`discard-version-dialog.description-${discardType}`}
              values={{releaseTitle: releaseName}}
            />
          </Text>
        </Box>
      </Stack>
    </Dialog>
  )
}
