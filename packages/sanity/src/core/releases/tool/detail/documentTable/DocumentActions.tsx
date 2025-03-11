import {CloseIcon, TargetIcon, UnpublishIcon} from '@sanity/icons'
import {Box, Card, Label, Menu, MenuDivider, Stack} from '@sanity/ui'
import {memo, useMemo, useState} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  isReleaseScheduledOrScheduling,
  useActiveReleases,
  useVersionOperations,
} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton, MenuGroup, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {useDocumentPairPermissions} from '../../../../store/_legacy/grants/documentPairPermissions'
import {getPublishedId, getVersionFromId} from '../../../../util/draftUtils'
import {DiscardVersionDialog} from '../../../components'
import {UnpublishVersionDialog} from '../../../components/dialog/UnpublishVersionDialog'
import {VersionContextMenuItem} from '../../../components/documentHeader/contextMenu/VersionContextMenuItem'
import {releasesLocaleNamespace} from '../../../i18n'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {type BundleDocumentRow} from '../ReleaseSummary'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

export const DocumentActions = memo(
  function DocumentActions({
    document,
    releaseTitle,
  }: {
    document: BundleDocumentRow
    releaseTitle: string
  }) {
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
    const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)
    const {t: coreT} = useTranslation()
    const {t} = useTranslation(releasesLocaleNamespace)
    const {data: releases} = useActiveReleases()
    const isAlreadyUnpublished = isGoingToUnpublish(document.document)
    const optionsReleaseList = releases
      .filter((v) => !isReleaseScheduledOrScheduling(v))
      .map((release) => ({
        value: release,
      }))

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

    const isDiscardVersionActionDisabled =
      !discardVersionPermission?.granted || isDiscardVersionPermissionsLoading
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

    const {createVersion, discardVersion} = useVersionOperations()

    const moveDocument = async (moveToRelease) => {
      await createVersion(getReleaseIdFromReleaseDocumentId(moveToRelease), document.document._id)
      const releaseId = getVersionFromId(document.document._id)
      if (releaseId) {
        await discardVersion(releaseId, document.document._id)
      }
    }

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
                <MenuGroup icon={TargetIcon} popover={{placement: 'bottom-start'}} text={'Move to'}>
                  <ReleasesList space={1}>
                    {optionsReleaseList.map((option) => {
                      return (
                        <MenuItem
                          as="a"
                          key={option.value._id}
                          onClick={() => moveDocument(option.value._id)}
                          renderMenuItem={() => <VersionContextMenuItem release={option.value} />}
                        />
                      )
                    })}
                  </ReleasesList>{' '}
                </MenuGroup>
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
            onClose={() => setShowDiscardDialog(false)}
            documentId={document.document._id}
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
  (prev, next) =>
    prev.document.memoKey === next.document.memoKey && prev.releaseTitle === next.releaseTitle,
)
