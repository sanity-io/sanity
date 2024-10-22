import {CloseIcon} from '@sanity/icons'
import {Card, Menu} from '@sanity/ui'
import {memo, useState} from 'react'
import {DiscardVersionDialog, useTranslation} from 'sanity'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {type BundleDocumentRow} from '../ReleaseSummary'

export const DocumentActions = memo(
  function DocumentActions({
    document,
    bundleTitle,
  }: {
    document: BundleDocumentRow
    bundleTitle: string
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
    prev.document.memoKey === next.document.memoKey && prev.bundleTitle === next.bundleTitle,
)
