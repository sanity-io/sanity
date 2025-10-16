import {ArrowLeftIcon} from '@sanity/icons'
import {memo, type ReactNode, useMemo} from 'react'
import {type GeneralPreviewLayoutKey, type InitialValueTemplateItem} from 'sanity'

import {Button} from '../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {PaneHeader as StructurePaneHeader} from '../../components/pane/PaneHeader'
import {usePane} from '../../components/pane/usePane'
import {PaneHeaderActions} from '../../components/paneHeaderActions/PaneHeaderActions'
import {BackLink} from '../../components/paneRouter/BackLink'
import {
  type PaneMenuItem,
  type PaneMenuItemGroup,
  type StructureToolPaneActionHandler,
} from '../../types'
import {useStructureTool} from '../../useStructureTool'
import {type SortOrder} from './types'

interface PaneHeaderProps {
  contentAfter?: ReactNode
  index: number
  initialValueTemplates?: InitialValueTemplateItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  menuItems?: PaneMenuItem[]
  setLayout: (layout: GeneralPreviewLayoutKey) => void
  setSortOrder: (sortOrder: SortOrder) => void
  title: string
}

export const PaneHeader = memo(
  ({
    contentAfter,
    index,
    initialValueTemplates = [],
    menuItemGroups = [],
    menuItems = [],
    setLayout,
    setSortOrder,
    title,
  }: PaneHeaderProps) => {
    const {features} = useStructureTool()
    const {collapsed, isLast} = usePane()
    // Prevent focus if this is the last (non-collapsed) pane.
    const tabIndex = isLast && !collapsed ? -1 : 0

    const actionHandlers = useMemo((): Record<string, StructureToolPaneActionHandler> => {
      return {
        setLayout: ({layout: value}: {layout: GeneralPreviewLayoutKey}) => {
          setLayout(value)
        },
        setSortOrder: (sort: SortOrder) => {
          setSortOrder(sort)
        },
      }
    }, [setLayout, setSortOrder])

    return (
      <TooltipDelayGroupProvider>
        <StructurePaneHeader
          actions={
            <PaneHeaderActions
              initialValueTemplateItems={initialValueTemplates}
              actionHandlers={actionHandlers}
              menuItemGroups={menuItemGroups}
              menuItems={menuItems}
            />
          }
          backButton={
            features.backButton &&
            index > 0 && (
              <Button
                as={BackLink}
                data-as="a"
                icon={ArrowLeftIcon}
                mode="bleed"
                tooltipProps={{content: 'Back'}}
              />
            )
          }
          contentAfter={contentAfter}
          tabIndex={tabIndex}
          title={title}
        />
      </TooltipDelayGroupProvider>
    )
  },
)

PaneHeader.displayName = 'Memo(PaneHeader)'
