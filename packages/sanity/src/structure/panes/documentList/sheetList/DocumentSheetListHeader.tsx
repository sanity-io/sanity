'use no memo'
// The `use no memo` directive is due to a known issue with react-table and react compiler: https://github.com/TanStack/table/issues/5567

import {CloseIcon, EllipsisHorizontalIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Box, Flex, Menu, Text} from '@sanity/ui'
import {flexRender, type Header as HeaderType, type HeaderGroup} from '@tanstack/react-table'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, MenuButton, MenuItem, Tooltip} from '../../../../ui-components'

const Header = styled.th<{width: number}>`
  margin: 16px;
  z-index: 1;
  padding: 22px 0px;
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

  const HeaderTag = isPinned ? PinnedHeader : Header

  const canShowHeaderMenu =
    header.column.getCanHide() &&
    (headerGroup.depth === 0 ? !header.column.columns.length : header.column.parent)

  const borderWidth = isPinned && header.column.getIsLastColumn('left') ? 2 : 1

  return (
    <HeaderTag
      style={{
        left: header.column.getStart('left') ?? undefined,
        borderRight: `${borderWidth}px solid var(--card-border-color)`,
      }}
      key={header.id}
      data-testid={`header-${header.id}`}
      width={header.getSize()}
    >
      <Flex justify="space-between" marginX={2} align="baseline">
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
                  <MenuItem
                    text={t('sheet-list.hide-field')}
                    icon={CloseIcon}
                    onClick={() => header.column.toggleVisibility()}
                  />
                </Menu>
              }
            />
          </HoverMenu>
        )}
      </Flex>
    </HeaderTag>
  )
}
