import {CloseIcon} from '@sanity/icons/Close'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Box, Card, Label, Menu, MenuDivider} from '@sanity/ui'
import {memo, useMemo, useState} from 'react'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useSchema} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {useDocumentPairPermissions} from '../../../../store/grants/documentPairPermissions'
import {getPublishedId, getVersionFromId} from '../../../../util/draftUtils'
import {DiscardVersionDialog} from '../../../components'
import {DeleteDocumentDialog} from '../../../components/dialog/DeleteDocumentDialog'
import {UnpublishVersionDialog} from '../../../components/dialog/UnpublishVersionDialog'
import {releasesLocaleNamespace} from '../../../i18n'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {type BundleDocumentRow} from '../ReleaseSummary'

const DocumentActionsInner = memo(
  function DocumentActionsInner({
    document,
    releaseTitle,
  }: {
    document: BundleDocumentRow
    releaseTitle: string | undefined
  }) {
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)
    const {t: coreT} = useTranslation()
    const {t} = useTranslation(releasesLocaleNamespace)
    const isAlreadyUnpublished = isGoingToUnpublish(document.document)

    const publishedId = getPublishedId(document.document._id)
    const type = document.document._type
    const version = getVersionFromId(document.document._id)

    const [discardVersionPermission, isDiscardVersionPermissionsLoading] =
      useDocumentPairPermissions({
        id: publishedId,
        type,
        version,
        permission: 'discardVersion',
      })
    const [unpublishPermission, isUnpublishPermissionsLoading] = useDocumentPairPermissions({
      id: publishedId,
      type,
      version,
      permission: 'unpublish',
    })
    const [deletePermission, isDeletePermissionsLoading] = useDocumentPairPermissions({
      id: publishedId,
      type,
      version,
      permission: 'delete',
    })

    const isDiscardVersionActionDisabled =
      !discardVersionPermission?.granted || isDiscardVersionPermissionsLoading
    const isDeleteActionDisabled = !deletePermission?.granted || isDeletePermissionsLoading
    const noPermissionToUnpublish = !unpublishPermission?.granted || isUnpublishPermissionsLoading

    const unPublishTooltipContent = useMemo(() => {
      if (noPermissionToUnpublish) {
        return t('permissions.error.unpublish')
      }
      if (!document.document.publishedDocumentExists) {
        return t('unpublish.no-published-version')
      }
      if (isAlreadyUnpublished) {
        return t('unpublish.already-unpublished')
      }

      return null
    }, [
      document.document.publishedDocumentExists,
      isAlreadyUnpublished,
      noPermissionToUnpublish,
      t,
    ])

    const isUnpublishActionDisabled =
      noPermissionToUnpublish || !document.document.publishedDocumentExists || isAlreadyUnpublished

    return (
      <>
        <Card tone="default" display="flex">
          <MenuButton
            id="document-actions"
            button={<ContextMenuButton />}
            menu={
              <Menu>
                <MenuItem
                  text={coreT('release.action.discard-version')}
                  icon={CloseIcon}
                  onClick={() => setShowDiscardDialog(true)}
                  disabled={isDiscardVersionActionDisabled}
                  tooltipProps={{
                    disabled: !isDiscardVersionActionDisabled,
                    content: t('permissions.error.discard-version'),
                  }}
                />
                <MenuItem
                  text={t('action.delete-document')}
                  icon={TrashIcon}
                  tone="critical"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleteActionDisabled}
                  tooltipProps={{
                    disabled: !isDeleteActionDisabled,
                    content: t('permissions.error.delete-document'),
                  }}
                />
                <MenuDivider />
                <Box padding={3} paddingBottom={2}>
                  <Label size={1}>{t('menu.group.when-releasing')}</Label>
                </Box>
                <MenuItem
                  text={t('action.unpublish')}
                  icon={UnpublishIcon}
                  disabled={isUnpublishActionDisabled}
                  tooltipProps={{
                    disabled: !isUnpublishActionDisabled,
                    content: unPublishTooltipContent,
                  }}
                  onClick={() => setShowUnpublishDialog(true)}
                />
              </Menu>
            }
          />
        </Card>
        {showDiscardDialog && (
          <DiscardVersionDialog
            isGoingToUnpublish={isGoingToUnpublish(document.document)}
            onClose={() => setShowDiscardDialog(false)}
            documentId={document.document._id}
            documentType={document.document._type}
            fromPerspective={releaseTitle || t('release-placeholder.title')}
          />
        )}
        {showDeleteDialog && (
          <DeleteDocumentDialog
            onClose={() => setShowDeleteDialog(false)}
            documentVersionId={document.document._id}
            documentType={document.document._type}
          />
        )}
        {showUnpublishDialog && (
          <UnpublishVersionDialog
            onClose={() => setShowUnpublishDialog(false)}
            documentVersionId={document.document._id}
            documentType={document.document._type}
          />
        )}
      </>
    )
  },
  (prev, next) => prev.document.memoKey === next.document.memoKey,
)

export const DocumentActions = memo(function GuardedDocumentActions(props: {
  document: BundleDocumentRow
  releaseTitle: string | undefined
}) {
  const schema = useSchema()
  const type = schema.get(props.document.document._type)
  const {t} = useTranslation()
  if (!type) {
    return (
      <ContextMenuButton
        disabled
        tooltipProps={{
          content: t('document.type.not-found', {type: props.document.document._type}),
        }}
      />
    )
  }

  return <DocumentActionsInner {...props} />
})
