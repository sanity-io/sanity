import {Stack, Text, useToast} from '@sanity/ui'
import {type CSSProperties, useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {unstable_useValuePreview as useValuePreview} from '../../../preview'
import {Preview} from '../../../preview/components/Preview'
import {getVersionFromId} from '../../../util/draftUtils'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'

export function UnpublishVersionDialog(props: {
  onClose: () => void
  documentVersionId: string
  documentType: string
}): React.JSX.Element {
  const {onClose, documentVersionId, documentType} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: coreT} = useTranslation()

  const schema = useSchema()
  const {unpublishVersion} = useVersionOperations()
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const toast = useToast()
  const {data} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()

  const release = data
    .concat(archivedReleases)
    .find(
      (candidate) =>
        getReleaseIdFromReleaseDocumentId(candidate._id) === getVersionFromId(documentVersionId),
    )

  const tone = getReleaseTone(release as ReleaseDocument)
  const schemaType = schema.get(documentType)

  const preview = useValuePreview({schemaType, value: {_id: documentVersionId}})

  const handleUnpublish = useCallback(async () => {
    setIsUnpublishing(true)

    try {
      await unpublishVersion(documentVersionId)
      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={coreT}
            i18nKey={'release.action.unpublish-version.success'}
            values={{title: preview?.value?.title || documentVersionId}}
          />
        ),
      })
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: coreT('release.action.unpublish-version.failure'),
        description: err.message,
      })
    }

    setIsUnpublishing(false)

    onClose()
  }, [coreT, documentVersionId, onClose, preview?.value?.title, toast, unpublishVersion])

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
              title: release?.metadata.title || coreT('release.placeholder-untitled-release'),
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
