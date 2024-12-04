import {CloseIcon, UnpublishIcon} from '@sanity/icons'
import {Box, Card, Label, Menu, MenuDivider} from '@sanity/ui'
import {memo, useState} from 'react'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {DiscardVersionDialog} from '../../../components'
import {UnpublishVersionDialog} from '../../../components/dialog/UnpublishVersionDialog'
import {releasesLocaleNamespace} from '../../../i18n'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {type BundleDocumentRow} from '../ReleaseSummary'

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
    const isAlreadyUnpublished = isGoingToUnpublish(document.document)

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
                />
                <MenuDivider />
                <Box padding={3} paddingBottom={2}>
                  <Label size={1}>{t('menu.group.when-releasing')}</Label>
                </Box>
                <MenuItem
                  text={t('action.unpublish')}
                  icon={UnpublishIcon}
                  disabled={!document.document.publishedDocumentExists || isAlreadyUnpublished}
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
