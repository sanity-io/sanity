import {Box, Flex, Label, Stack, Text} from '@sanity/ui'
import {MenuItem} from '@sanity/ui/menu'
import {type ReactNode} from 'react'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'

/**
 * The rows of option B's "Other versions" popover, laid out as the Studio's version menu lays out a release
 * (`GlobalPerspectiveMenuItem`) and as the Storybook exploration draws them (pills/shippedRows.tsx): the stock `MenuItem` with
 * padding 1, an icon in a box, the title (13px, medium) and an optional muted second line. 35px with one line, 50px with two.
 * The section heading is the Studio's `Label`: muted, uppercase, 9.5px, 600, 0.5px tracking.
 */

export function MenuHeading({children}: {children: ReactNode}) {
  return (
    <Box paddingBottom={1} paddingLeft={2} paddingTop={3}>
      <Label muted size={1} style={{textTransform: 'uppercase'}}>
        {children}
      </Label>
    </Box>
  )
}

export function ShippedRow(props: {
  icon?: ReactNode
  title: string
  subtitle?: string
  selected?: boolean
  onClick: () => void
  testId?: string
}) {
  return (
    <MenuItem
      data-testid={props.testId}
      onClick={props.onClick}
      padding={1}
      pressed={props.selected}
      selected={props.selected}
    >
      {/* 42px of content with a second line and 27px without, plus the item's 4px padding either side: 50 and 35. */}
      <Flex
        align={props.subtitle ? 'flex-start' : 'center'}
        gap={1}
        style={{height: props.subtitle ? 42 : 27, overflow: 'hidden'}}
      >
        <Box flex="none" paddingX={3} paddingY={props.subtitle ? 2 : 0}>
          <Text size={props.subtitle ? 2 : 1}>
            {props.icon ?? (
              <span aria-hidden style={{visibility: 'hidden'}}>
                <RhombusIcon />
              </span>
            )}
          </Text>
        </Box>
        <Stack flex={1} gap={2} paddingY={props.subtitle ? 2 : 0} style={{minWidth: 0}}>
          <Text size={1} weight="medium">
            {props.title}
          </Text>
          {props.subtitle ? (
            <Text muted size={1}>
              {props.subtitle}
            </Text>
          ) : null}
        </Stack>
      </Flex>
    </MenuItem>
  )
}
