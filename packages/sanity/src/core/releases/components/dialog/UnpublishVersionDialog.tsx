import {Stack, Text} from '@sanity/ui'
import {type CSSProperties, useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {Preview} from '../../../preview/components/Preview'
import {getVersionFromId} from '../../../util/draftUtils'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {useReleases} from '../../store/useReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'

export function UnpublishVersionDialog(props: {
  onClose: () => void
  documentVersionId: string
  documentType: string
}): React.JSX.Element {
  const {onClose, documentVersionId, documentType} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const schema = useSchema()
  const {unpublishVersion} = useVersionOperations()
  const [isUnpublishing, setIsUnpublishing] = useState(false)

  const {data} = useReleases()
  const {archivedReleases} = useArchivedReleases(data)

  const releaseInDetail = data
    .concat(archivedReleases)
    .find(
      (candidate) =>
        getReleaseIdFromReleaseDocumentId(candidate._id) === getVersionFromId(documentVersionId),
    )

  const tone = getReleaseTone(releaseInDetail as ReleaseDocument)
  const schemaType = schema.get(documentType)

  const handleUnpublish = useCallback(async () => {
    setIsUnpublishing(true)

    await unpublishVersion(documentVersionId)
    setIsUnpublishing(false)

    onClose()
  }, [documentVersionId, onClose, unpublishVersion])

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
          disabled: isUnpublishing,
          loading: isUnpublishing,
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
              title: releaseInDetail?.metadata.title,
            }}
            components={{
              Label: ({children}) => {
                return (
                  <span
                    style={
                      {
                        color: `var(--card-badge-${tone ?? 'default'}-fg-color)`,
                        backgroundColor: `var(--card-badge-${tone ?? 'default'}-bg-color)`,
                        borderRadius: 3,
                        textDecoration: 'none',
                        padding: '0px 2px',
                        fontWeight: 500,
                      } as CSSProperties
                    }
                  >
                    {children}
                  </span>
                )
              },
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
