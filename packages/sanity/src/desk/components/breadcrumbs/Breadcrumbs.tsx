import {Box, Text, useClickOutside, Popover, Stack} from '@sanity/ui'
import React, {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {ChevronRightIcon} from '@sanity/icons'
import {BreadcrumbItemRoot, ExpandButton, Root} from './breadcrumbs.styles'

/**
 * @internal
 * @hidden
 */
export interface BreadcrumbsProps {
  maxLength?: number
}

/**
 * @internal
 * @hidden
 */
export const Breadcrumbs = forwardRef(function Breadcrumbs(
  props: BreadcrumbsProps & Omit<React.HTMLProps<HTMLOListElement>, 'as' | 'ref' | 'type'>,
  ref: React.ForwardedRef<HTMLOListElement>
) {
  const {children, maxLength, ...restProps} = props
  const [open, setOpen] = useState(false)
  const [expandElement, setExpandElement] = useState<HTMLButtonElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const collapse = useCallback(() => setOpen(false), [])
  const expand = useCallback(() => setOpen(true), [])

  useClickOutside(collapse, [expandElement, popoverElement])

  const rawItems = useMemo(
    () =>
      Children.toArray(children).filter((child) => {
        return isValidElement(child)
      }),
    [children]
  )

  const items = useMemo(() => {
    const len = rawItems.length

    if (maxLength && len > maxLength) {
      const afterLength = Math.floor(maxLength / 2)

      return [
        <Popover
          constrainSize
          content={
            <Stack as="ol" overflow="auto" padding={2}>
              {rawItems.slice(0, len - maxLength)}
            </Stack>
          }
          key="button"
          open={open}
          placement="top"
          portal
          ref={setPopoverElement}
        >
          <ExpandButton
            mode="bleed"
            onClick={open ? collapse : expand}
            padding={2}
            ref={setExpandElement}
            selected={open}
            text="…"
          />
        </Popover>,
        ...rawItems.slice(len - maxLength, len - afterLength),
        ...rawItems.slice(len - afterLength),
      ]
    }

    return rawItems
  }, [collapse, expand, maxLength, open, rawItems])

  return (
    <Root data-ui="Breadcrumbs" {...restProps} ref={ref}>
      {items.map((item, itemIndex) => (
        // eslint-disable-next-line react/no-array-index-key
        <Fragment key={itemIndex}>
          {itemIndex > 0 && (
            <Box aria-hidden as="li" paddingX={1}>
              <Text data-ui="TextChevronRight" muted>
                <ChevronRightIcon />
              </Text>
            </Box>
          )}
          <BreadcrumbItemRoot as="li">{item}</BreadcrumbItemRoot>
        </Fragment>
      ))}
    </Root>
  )
})
