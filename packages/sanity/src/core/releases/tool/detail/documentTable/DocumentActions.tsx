/* eslint-disable i18next/no-literal-string */
import {CloseIcon, UnpublishIcon} from '@sanity/icons'
import {Box, Card, Label, Menu, MenuDivider} from '@sanity/ui'
import {memo, useState} from 'react'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {DiscardVersionDialog} from '../../../components'
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
    const {t: coreT} = useTranslation()

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
                  {/** @todo translate */}
                  <Label size={1}>When releasing</Label>
                </Box>
                <MenuItem
                  text={coreT('release.action.unpublish-version')}
                  icon={UnpublishIcon}
                  disabled={!document.document.publishedDocumentExists}
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
      </>
    )
  },
  (prev, next) =>
    prev.document.memoKey === next.document.memoKey && prev.releaseTitle === next.releaseTitle,
)
