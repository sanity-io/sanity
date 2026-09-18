import {CloseIcon} from '@sanity/icons/Close'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Card, Label} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {memo, useMemo, useState} from 'react'
import {Box} from 'ui5'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {ContextMenuButton} from '../../../../components/contextMenuButton/ContextMenuButton'
import {InsufficientPermissionsMessage} from '../../../../components/InsufficientPermissionsMessage'
import {useConfiguredDocumentActionIds} from '../../../../config/document/useConfiguredDocumentActionIds'
import {type DocumentActionsVersionType} from '../../../../config/types'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useDocumentPairPermissions} from '../../../../store/grants/documentPairPermissions'
import {useCurrentUser} from '../../../../store/user/hooks'
import {getPublishedId, getVersionFromId} from '../../../../util/draftUtils'
import {getVariantPublishedSibling} from '../../../../util/getTargetDocument'
import {DiscardVersionDialog} from '../../../components/dialog/DiscardVersionDialog'
import {UnpublishVersionDialog} from '../../../components/dialog/UnpublishVersionDialog'
import {useDocumentVersions} from '../../../hooks/useDocumentVersions'
import {releasesLocaleNamespace} from '../../../i18n'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {type BundleDocumentRow} from '../ReleaseSummary'

interface UnpublishMenuItemProps {
  hasPermission: boolean
  isAlreadyUnpublished: boolean
  isPermissionsLoading: boolean
  isPublished: boolean
  isPublishStateResolving: boolean
  onClick: () => void
}

function UnpublishMenuItem({
  hasPermission,
  isAlreadyUnpublished,
  isPermissionsLoading,
  isPublished,
  isPublishStateResolving,
  onClick,
}: UnpublishMenuItemProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const currentUser = useCurrentUser()
  const insufficientPermissions = !isPermissionsLoading && !hasPermission

  const tooltipContent = useMemo(() => {
    if (insufficientPermissions) {
      return (
        <InsufficientPermissionsMessage context="unpublish-document" currentUser={currentUser} />
      )
    }
    if (isPermissionsLoading || isPublishStateResolving) {
      return null
    }
    if (!isPublished) {
      return t('unpublish.no-published-version')
    }
    if (isAlreadyUnpublished) {
      return t('unpublish.already-unpublished')
    }

    return null
  }, [
    currentUser,
    insufficientPermissions,
    isAlreadyUnpublished,
    isPermissionsLoading,
    isPublished,
    isPublishStateResolving,
    t,
  ])

  return (
    <MenuItem
      text={t('action.unpublish')}
      icon={UnpublishIcon}
      disabled={
        isPermissionsLoading ||
        !hasPermission ||
        isPublishStateResolving ||
        !isPublished ||
        isAlreadyUnpublished
      }
      tooltipProps={{content: tooltipContent, disabled: !tooltipContent}}
      onClick={onClick}
    />
  )
}

/**
 * A variant's publish state is answered by its variant-of-published sibling; the row's
 * `publishedDocumentExists` addresses the base published document.
 */
function VariantUnpublishMenuItem({
  publishedId,
  variantId,
  ...menuItemProps
}: Omit<UnpublishMenuItemProps, 'isPublished' | 'isPublishStateResolving'> & {
  publishedId: string
  variantId: string
}) {
  const {versions, loading} = useDocumentVersions({documentId: publishedId})

  const publishedSibling = useMemo(
    () => getVariantPublishedSibling({variant: variantId, documentVersions: versions}),
    [variantId, versions],
  )

  return (
    <UnpublishMenuItem
      {...menuItemProps}
      isPublished={publishedSibling !== undefined}
      isPublishStateResolving={loading}
    />
  )
}

const DocumentActionsInner = memo(
  function DocumentActionsInner({
    document,
    releaseId,
    releaseTitle,
    versionType,
  }: {
    document: BundleDocumentRow
    releaseId: string
    releaseTitle: string | undefined
    versionType: DocumentActionsVersionType
  }) {
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
    const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)
    const {t: coreT} = useTranslation()
    const {t} = useTranslation(releasesLocaleNamespace)
    const currentUser = useCurrentUser()
    const isAlreadyUnpublished = isGoingToUnpublish(document.document)

    const publishedId = getPublishedId(document.document._id)
    const type = document.document._type
    // Permission checks address the row's own version, keyed by the scope segment of its id.
    const version = getVersionFromId(document.document._id)
    const variantId = document.document._system?.variant?._ref

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

    const hasDiscardVersionPermission = Boolean(discardVersionPermission?.granted)
    const hasUnpublishPermission = Boolean(unpublishPermission?.granted)
    const insufficientDiscardPermissions =
      !isDiscardVersionPermissionsLoading && !hasDiscardVersionPermission
    const discardTooltipContent = insufficientDiscardPermissions ? (
      <InsufficientPermissionsMessage context="discard-changes" currentUser={currentUser} />
    ) : null

    const configuredActionIds = useConfiguredDocumentActionIds({
      schemaType: type,
      documentId: publishedId,
      versionType,
      releaseId,
    })
    const showDiscardVersion = configuredActionIds.has('discardVersion')
    const showUnpublish = configuredActionIds.has('unpublishVersion')
    const hasConfiguredMenuItems = showDiscardVersion || showUnpublish

    if (!hasConfiguredMenuItems) return null

    const unpublishMenuItemProps = {
      hasPermission: hasUnpublishPermission,
      isAlreadyUnpublished,
      isPermissionsLoading: isUnpublishPermissionsLoading,
      onClick: () => setShowUnpublishDialog(true),
    }

    return (
      <>
        <Card tone="default" display="flex">
          <MenuButton
            id="document-actions"
            button={<ContextMenuButton />}
            menu={
              <Menu>
                {showDiscardVersion && (
                  <MenuItem
                    text={coreT('release.action.discard-version')}
                    icon={CloseIcon}
                    onClick={() => setShowDiscardDialog(true)}
                    disabled={isDiscardVersionPermissionsLoading || !hasDiscardVersionPermission}
                    tooltipProps={{
                      content: discardTooltipContent,
                      disabled: !discardTooltipContent,
                    }}
                  />
                )}
                {showUnpublish && (
                  <>
                    {showDiscardVersion && <MenuDivider />}
                    <Box padding={3} paddingBottom={2}>
                      <Label size={1}>{t('menu.group.when-releasing')}</Label>
                    </Box>
                    {variantId ? (
                      <VariantUnpublishMenuItem
                        {...unpublishMenuItemProps}
                        publishedId={publishedId}
                        variantId={variantId}
                      />
                    ) : (
                      <UnpublishMenuItem
                        {...unpublishMenuItemProps}
                        isPublished={document.document.publishedDocumentExists}
                        isPublishStateResolving={false}
                      />
                    )}
                  </>
                )}
              </Menu>
            }
          />
        </Card>
        {showDiscardDialog && (
          <DiscardVersionDialog
            isGoingToUnpublish={isGoingToUnpublish(document.document)}
            onClose={() => setShowDiscardDialog(false)}
            versionId={document.document._id}
            documentType={document.document._type}
            fromPerspective={releaseTitle || t('release-placeholder.title')}
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
  (prev, next) =>
    prev.document.memoKey === next.document.memoKey &&
    prev.versionType === next.versionType &&
    prev.releaseId === next.releaseId &&
    prev.releaseTitle === next.releaseTitle,
)

export const DocumentActions = memo(function GuardedDocumentActions(props: {
  document: BundleDocumentRow
  releaseId: string
  releaseTitle: string | undefined
  versionType: DocumentActionsVersionType
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
