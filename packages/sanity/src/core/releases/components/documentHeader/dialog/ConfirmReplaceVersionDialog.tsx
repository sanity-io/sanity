import {Dialog} from '../../../../../ui-components'
import {Translate} from '../../../../i18n/Translate'
import {type ReleaseDocument} from '../../../store'
import {LATEST} from '../../../util/const'

type ConfirmReplaceVersionDialogProps = {
  onClose: () => void
  onReplaceVersion: () => void
  targetRelease: ReleaseDocument
  documentId: string
  documentType: string
}
export const ConfirmReplaceVersionDialog = ({
  onClose,
  onReplaceVersion,
  targetRelease,
  documentId,
  documentType,
}: ConfirmReplaceVersionDialogProps) => {
  const replaceType = targetRelease === LATEST ? 'drafts' : 'release'

  return (
    <Dialog
      id={'replace-version-dialog'}
      header={
        <Translate
          t={t}
          i18nKey={`replace-version-dialog.header-${replaceType}`}
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
