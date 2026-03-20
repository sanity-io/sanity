'use no memo'
// The `use no memo` directive is due to a known issue with react-table and react compiler: https://github.com/TanStack/table/issues/5567

import {CloseIcon, EllipsisHorizontalIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Box, Flex, Menu, Text} from '@sanity/ui'
import {flexRender, type Header as HeaderType, type HeaderGroup} from '@tanstack/react-table'
import {useTranslation} from 'sanity'

import {Button, MenuButton, MenuItem, Tooltip} from '../../../../ui-components'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {header as headerClass, pinnedHeader, hoverMenu, widthVar} from './DocumentSheetListHeader.css'


type DocumentSheetListHeaderProps = {
  header: HeaderType<SanityDocument, unknown>
  headerGroup: HeaderGroup<SanityDocument>
}

export function DocumentSheetListHeader(props: DocumentSheetListHeaderProps) {
  const {header, headerGroup} = props
  const {t} = useTranslation()

  const isPinned = header.column.getIsPinned()

  const headerTitle =
    headerGroup.depth > 0 && !header.column.parent ? null : (
      <Text size={1} weight="semibold" textOverflow="ellipsis">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </Text>
    )

  const headerClassName = isPinned ? pinnedHeader : headerClass

  const canShowHeaderMenu =
    header.column.getCanHide() &&
    (headerGroup.depth === 0 ? !header.column.columns.length : header.column.parent)

  const borderWidth = isPinned && header.column.getIsLastColumn('left') ? 2 : 1

  return (
    <th
      key={header.id}
      className={headerClassName}
      style={{
        left: header.column.getStart('left') ?? undefined,
        borderRight: `${borderWidth}px solid var(--card-border-color)`,
        ...assignInlineVars({[widthVar]: `${header.getSize()}px`}),
      }}
      data-testid={`header-${header.id}`}
    >
      <Flex justify="space-between" marginX={2} align="baseline">
        <Tooltip delay={500} content={headerTitle}>
          <Box style={{boxSizing: 'border-box'}} marginLeft={3} marginRight={3}>
            {headerTitle}
          </Box>
        </Tooltip>
        {canShowHeaderMenu && (
          <div className={hoverMenu}>
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
                  <MenuItem
                    text={t('sheet-list.hide-field')}
                    icon={CloseIcon}
                    onClick={() => header.column.toggleVisibility()}
                  />
                </Menu>
              }
            />
          </div>
        )}
      </Flex>
    </th>
  )
}
