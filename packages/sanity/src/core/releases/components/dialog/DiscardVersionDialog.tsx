import {type ReleaseDocument} from '@sanity/client'
import {getVersionNameFromId, type VersionId} from '@sanity/id-utils'
import {Box, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useDocumentOperation, useSchema} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {type TargetPerspective} from '../../../perspective/types'
import {usePerspective} from '../../../perspective/usePerspective'
import {Preview} from '../../../preview'
import {getPublishedId, getVersionFromId, isDraftId, isVersionId} from '../../../util/draftUtils'
import {useVersionOperations} from '../../hooks'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
/**
 * @internal
 */
export function DiscardVersionDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
  fromPerspective: string | TargetPerspective
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
  const currentRelease = getVersionNameFromId(documentId as VersionId)

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
      <Stack gap={3} paddingX={3} marginBottom={2}>
        {schemaType ? (
          <Preview
            value={{_id: documentId}}
            schemaType={schemaType}
            perspectiveStack={[currentRelease]}
          />
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
