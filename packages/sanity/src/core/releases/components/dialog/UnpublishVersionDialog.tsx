import {Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {usePerspective} from 'sanity'

import {isString} from '../../../../_internal/manifest/manifestTypeHelpers'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {Preview} from '../../../preview/components/Preview'
import {releasesLocaleNamespace} from '../../i18n'

export function UnpublishVersionDialog(props: {
  onClose: () => void
  documentVersionId: string
  documentType: string
}) {
  const {onClose, documentVersionId, documentType} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const schema = useSchema()
  const {currentGlobalBundle} = usePerspective()

  const schemaType = schema.get(documentType)

  const handleUnpublish = useCallback(() => {
    /** @todo unpublish */
    onClose()
  }, [onClose])

  return (
    <Dialog
      header={t('unpublish-dialog.header')}
      id="document-unpublish-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          text: t('unpublish-dialog.action.cancel'),
          onClick: onClose,
        },
        confirmButton: {
          text: t('unpublish-dialog.action.unpublish'),
          onClick: handleUnpublish,
          tone: 'critical',
        },
      }}
    >
      <Stack space={4} paddingX={4} paddingBottom={4}>
        {schemaType ? (
          <Preview value={{_id: documentVersionId}} schemaType={schemaType} />
        ) : (
          <LoadingBlock />
        )}

        <Text muted size={1}>
          <Translate
            t={t}
            i18nKey="unpublish-dialog.description.to-draft"
            values={{
              title: isString(currentGlobalBundle)
                ? currentGlobalBundle
                : currentGlobalBundle.metadata.title,
            }}
          />
        </Text>

        <Text muted size={1}>
          {t('unpublish-dialog.description.lost-changes')}
        </Text>
      </Stack>
    </Dialog>
  )
}
