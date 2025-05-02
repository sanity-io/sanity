import {type SanityDocument} from '@sanity/types'
import {Box, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {filter, firstValueFrom} from 'rxjs'

import {Dialog} from '../../../../ui-components'
import {useDocumentOperation} from '../../../hooks/useDocumentOperation'
import {Translate} from '../../../i18n/Translate'
import {useDocumentStore} from '../../../store/_legacy/datastores'
import {getPublishedId, getVersionFromId} from '../../../util/draftUtils'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'

interface PublishVersionDocumentDialogProps {
  onClose: () => void
  document: SanityDocument
  releaseTitle: string
}
export const PublishVersionDocumentDialog = (props: PublishVersionDocumentDialogProps) => {
  const {onClose, document, releaseTitle} = props
  const version = getVersionFromId(document._id)
  const documentStore = useDocumentStore()
  // eslint-disable-next-line no-console
  console.log({p: getPublishedId(document._id), type: document._type, version})
  const documentOperation = useDocumentOperation(
    getPublishedId(document._id),
    document._type,
    version,
  )
  const {discardVersion} = useVersionOperations()

  const {t} = useTranslation(releasesLocaleNamespace)

  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = useCallback(async () => {
    if (!version) return

    setIsPublishing(true)
    const publishSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(getPublishedId(document._id), document._type)
        .pipe(filter((e) => e.op === 'publish' && e.type === 'success')),
    )
    documentOperation.publish.execute()

    await publishSuccess
    await discardVersion(version, document._id)

    setIsPublishing(false)

    onClose()
  }, [
    version,
    documentStore.pair,
    document._id,
    document._type,
    documentOperation.publish,
    discardVersion,
    onClose,
  ])

  return (
    <Dialog
      header={t('publish-version-document-dialog.header')}
      id="publish-version-document-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          text: t('publish-version-document-dialog.action.cancel'),
          onClick: onClose,
        },
        confirmButton: {
          text: t('publish-version-document-dialog.action.publish'),
          onClick: handlePublish,
          tone: 'critical',
          disabled: isPublishing,
        },
      }}
    >
      <Stack space={3} paddingX={3} marginBottom={2}>
        <Box paddingX={2}>
          <Text size={1} muted>
            <Translate
              t={t}
              i18nKey="publish-version-document-dialog.description"
              values={{releaseTitle}}
            />
          </Text>
        </Box>
      </Stack>
    </Dialog>
  )
}
