import {
  Container,
  ContainerProps,
  rem,
  ResponsiveWidthStyleProps,
  Theme,
  useArrayProp,
  _responsive,
} from '@sanity/ui'
import React, {Ref} from 'react'
import styled from 'styled-components'

// This is a workaround to make sure that the Container gets the correct width when used inside a popover.
// The default Container uses `maxWidth` which doesn't work well with popovers because the popover
// calculates its width based on the content width.
const StyledContainer = styled(Container)((props: ResponsiveWidthStyleProps & {theme: Theme}) => {
  const {theme} = props
  const {container, media} = theme.sanity

  return _responsive(media, props.$width, (val) => ({
    // Make sure that the Container gets the correct width when used inside a popover.
    width: val === 'auto' ? 'none' : rem(container[val]),
    // Make sure that the Container width is constrained by available space.
    maxWidth: '100%',
  }))
})

interface PopoverContainerProps extends ContainerProps {
  children: React.ReactNode
}

export const PopoverContainer = React.forwardRef(function PopoverContainer(
  props: PopoverContainerProps,
  ref: Ref<HTMLDivElement>
) {
  const {width, ...restProps} = props
  const widthArr = useArrayProp(width)

  return <StyledContainer {...restProps} data-ui="PopoverContainer" $width={widthArr} ref={ref} />
})
