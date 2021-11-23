// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {ArrowLeftIcon, CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Button, Inline} from '@sanity/ui'
import {negate} from 'lodash'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {memo, forwardRef, useMemo} from 'react'
import {PaneMenuItem} from '../../../../types'
import {PaneHeader, PaneContextMenuButton} from '../../../../components/pane'
import {useDeskTool} from '../../../../contexts/deskTool'
import {BackLink, usePaneRouter} from '../../../../contexts/paneRouter'
import {TimelineMenu} from '../../timeline'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentHeaderTabs} from './DocumentHeaderTabs'
import {ValidationMenu} from './ValidationMenu'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'

export interface DocumentPanelHeaderProps {
  rootElement: HTMLDivElement | null
}

const isActionButton = (item: PaneMenuItem) => Boolean(item.showAsAction)
const isMenuButton = negate(isActionButton)

export const DocumentPanelHeader = memo(
  forwardRef(({rootElement}: DocumentPanelHeaderProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const {
      documentSchema,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      historyController,
      markers,
      menuItems,
      menuItemGroups,
      ready,
      views,
    } = useDocumentPane()
    const {revTime: rev} = historyController
    const {features} = useDeskTool()
    const {index, siblingIndex} = usePaneRouter()
    const contextMenuItems = useMemo(() => menuItems.filter(isMenuButton), [menuItems])
    const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)
    const showTabs = views.length > 1
    const closable = siblingIndex > 0
    const showVersionMenu = features.reviewChanges

    return (
      <PaneHeader
        ref={ref}
        loading={!ready}
        title={<DocumentHeaderTitle />}
        tabs={showTabs && <DocumentHeaderTabs />}
        backButton={
          features.backButton &&
          index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
        }
        subActions={showVersionMenu && <TimelineMenu chunk={rev} mode="rev" />}
        actions={
          <Inline space={1}>
            {LanguageFilter && <LanguageFilter key="language-menu" schemaType={documentSchema} />}

            {markers.length > 0 && (
              <ValidationMenu
                boundaryElement={rootElement}
                isOpen={isValidationOpen}
                key="validation-menu"
                setOpen={setValidationOpen}
              />
            )}

            <PaneContextMenuButton
              itemGroups={menuItemGroups}
              items={contextMenuItems}
              key="context-menu"
              onAction={handleMenuAction}
            />

            {!features.splitViews || !handlePaneSplit || views.length <= 1 ? null : (
              <Button
                icon={SplitVerticalIcon}
                key="split-pane-button"
                mode="bleed"
                onClick={handlePaneSplit}
                title="Split pane right"
              />
            )}

            {!features.splitViews || !handlePaneSplit || !closable ? null : (
              <Button
                icon={CloseIcon}
                key="close-view-button"
                mode="bleed"
                onClick={handlePaneClose}
                title="Close pane"
              />
            )}
          </Inline>
        }
      />
    )
  })
)

DocumentPanelHeader.displayName = 'DocumentPanelHeader'
