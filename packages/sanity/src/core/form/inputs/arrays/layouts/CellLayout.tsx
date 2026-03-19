import {Box, Card, type CardTone, Flex} from '@sanity/ui'
import {type ComponentProps, type ReactNode} from 'react'

import {DragHandle} from '../common/DragHandle'
import {dragHandleCard, footerFlex, presenceFlex, root} from './CellLayout.css'

interface RowLayoutProps {
  tone?: CardTone
  dragHandle?: boolean
  presence?: ReactNode
  validation?: ReactNode
  menu?: ReactNode
  footer?: ReactNode
  selected?: boolean
  children?: ReactNode
}

/**
 * Use this to get the layout for grid items
 */
export function CellLayout(props: RowLayoutProps & ComponentProps<typeof Card>) {
  const {
    validation,
    selected,
    tone,
    presence,
    children,
    dragHandle,
    menu,
    footer,
    readOnly,
    ...rest
  } = props

  return (
    <Card
      className={root}
      border
      selected={selected}
      aria-selected={selected}
      radius={1}
      tone={tone}
      {...rest}
    >
      {children}

      {dragHandle && (
        <Card
          className={dragHandleCard}
          margin={1}
          radius={2}
          display="flex"
          tone="inherit"
          data-ui="DragHandleCard"
        >
          <DragHandle $grid mode="ghost" readOnly={!!readOnly} />
        </Card>
      )}

      {presence && (
        <Flex className={presenceFlex} align="center" marginX={1}>
          {presence}
        </Flex>
      )}

      <Flex
        className={footerFlex}
        align="center"
        paddingX={1}
        sizing="border"
        justify="space-between"
      >
        <Flex>{validation}</Flex>
        <Box>{footer}</Box>
        {menu}
      </Flex>
    </Card>
  )
}
