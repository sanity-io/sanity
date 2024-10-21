import {Box, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getVersionFromId,
  LoadingBlock,
  Preview,
  Translate,
  useClient,
  usePerspective,
  useSchema,
  useTranslation,
} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

import {Dialog} from '../../../../../../../ui-components'

export function DiscardVersionDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
}): JSX.Element {
  const {onClose, documentId, documentType} = props
  const [isDiscarding, setIsDiscarding] = useState(false)
  const toast = useToast()

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {perspective} = usePaneRouter()

  const {setPerspective} = usePerspective()
  const {t} = useTranslation()
  const schema = useSchema()
  const schemaType = schema.get(documentType)

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)
    try {
      // if it's a version it'll always use the versionId based on the menu that it's pressing
      // otherwise it'll use the documentId
      /** @todo eventually change this from using document operations */
      await client.delete(documentId)

      if (perspective?.replace('bundle.', '') === getVersionFromId(documentId)) {
        setPerspective('drafts')
      }

      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey={'release.action.discard-version.success'}
            values={{title: document.title as string}}
          />
        ),
      })
    } catch (e) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.discard-version.failure'),
      })
    }

    setIsDiscarding(false)
    onClose()
  }, [client, documentId, perspective, toast, t, onClose, setPerspective])

  return (
    <Dialog
      id={'discard-version-dialog'}
      header={'Are you sure you want to discard the changes?'}
      onClickOutside={onClose}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          disabled: isDiscarding,
          onClick: onClose,
        },
        confirmButton: {
          text: 'Yes, discard version',
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
