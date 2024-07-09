import {CloseIcon, EllipsisHorizontalIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuButton, Text} from '@sanity/ui'
import {flexRender, type Header as HeaderType, type HeaderGroup} from '@tanstack/react-table'
import {useCallback} from 'react'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, MenuItem, Tooltip} from '../../../../ui-components'
import {SheetListLocaleNamespace} from './i18n'
import {type DocumentSheetListTable, type DocumentSheetTableRow} from './types'
import {getBorderWidth} from './utils'

const Header = styled.th<{width: number}>`
  margin: 16px;
  z-index: 10;
  border-top: 1px solid var(--card-border-color);
  background-color: var(--card-badge-default-bg-color);
  box-sizing: border-box;
  text-align: left;
  width: ${({width}) => width}px;
  max-width: ${({width}) => width}px;
`

const PinnedHeader = styled(Header)`
  position: sticky;
  z-index: 2;
`

const HoverMenu = styled.div`
  visibility: hidden;

  ${Header}:hover & {
    visibility: visible;
  }
`

type DocumentSheetListHeaderProps = {
  header: HeaderType<DocumentSheetTableRow, unknown>
  headerGroup: HeaderGroup<DocumentSheetTableRow>
  table: DocumentSheetListTable
}

const HeaderRoot = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 59px;
`

// Creates an invisible resizer element that can be used to resize the column
const Resizer = styled.div`
  position: absolute;
  opacity: 0;
  top: 0;
  height: 100%;
  width: 8px;
  right: -4px;
  cursor: col-resize;
  user-select: none;
  touch-action: none;
`

export function DocumentSheetListHeader(props: DocumentSheetListHeaderProps) {
  const {header, headerGroup, table} = props
  const {t} = useTranslation(SheetListLocaleNamespace)

  const isPinned = header.column.getIsPinned()
  const shouldHideTitle = headerGroup.depth > 0 && !header.column.parent

  const headerTitle = shouldHideTitle ? null : (
    <Text size={1} weight="semibold" textOverflow="ellipsis">
      {flexRender(header.column.columnDef.header, header.getContext())}
    </Text>
  )

  const HeaderTag = isPinned ? PinnedHeader : Header

  const canShowHeaderMenu = shouldHideTitle ? false : header.column.getCanHide()

  const hideColumn = useCallback(() => {
    if (header.subHeaders.length > 0) {
      // Hide all inner columns
      table.setColumnVisibility((prev) => {
        const newVisibility = {...prev}
        for (const subHeader of header.subHeaders) {
          newVisibility[subHeader.id] = false
        }
        return newVisibility
      })
    } else {
      header.column.toggleVisibility()
    }
  }, [header.column, header.subHeaders, table])

  return (
    <HeaderTag
      style={{
        left: header.column.getStart('left') ?? undefined,
        borderRight: `${getBorderWidth(header)}px solid var(--card-border-color)`,
      }}
      key={header.id}
      data-testid={`header-${header.id}`}
      width={header.getSize()}
    >
      <HeaderRoot>
        {header.column.columnDef.meta?.customHeader ? (
          flexRender(header.column.columnDef.header, header.getContext())
        ) : (
          <>
            <Flex justify="space-between" marginX={2} align="baseline" style={{width: '100%'}}>
              <Tooltip delay={500} content={headerTitle}>
                <Box style={{boxSizing: 'border-box'}} marginLeft={3} marginRight={3}>
                  {headerTitle}
                </Box>
              </Tooltip>
              {canShowHeaderMenu && (
                <HoverMenu>
                  <MenuButton
                    button={
                      <Button
                        tooltipProps={{content: 'Open field menu'}}
                        mode="bleed"
                        icon={EllipsisHorizontalIcon}
                        data-testid="field-menu-button"
                      />
                    }
                    id="field menu"
                    popover={{placement: 'bottom-end'}}
                    menu={
                      <Menu>
                        <MenuItem text={t('hide-field')} icon={CloseIcon} onClick={hideColumn} />
                      </Menu>
                    }
                  />
                </HoverMenu>
              )}
            </Flex>
            <Resizer
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              onDoubleClick={() => header.column.resetSize()}
            />
          </>
        )}
      </HeaderRoot>
    </HeaderTag>
  )
}
