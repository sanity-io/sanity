import {
  _responsive,
  Container,
  type ContainerProps,
  rem,
  type ResponsiveWidthStyleProps,
} from '@sanity/ui'
import {type ReactNode, type Ref, type RefAttributes} from 'react'
import {styled} from 'styled-components'

// This is a workaround to make sure that the Container gets the correct width when used inside a popover.
// The default Container uses `maxWidth` which doesn't work well with popovers because the popover
// calculates its width based on the content width.
const StyledContainer = styled(Container)<ResponsiveWidthStyleProps>((props) => {
  const {theme} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {container, media} = theme.sanity

  return _responsive(media, props.$width, (val) => ({
    // Make sure that the Container gets the correct width when used inside a popover.
    width: val === 'auto' ? 'none' : rem(container[val]),
    // Make sure that the Container width is constrained by available space.
    maxWidth: '100%',
  }))
})

interface PopoverContainerProps extends ContainerProps {
  children: ReactNode
}

export function PopoverContainer(props: PopoverContainerProps & RefAttributes<HTMLDivElement>) {
  const {ref, width = [], ...restProps} = props

  return (
    <StyledContainer
      {...restProps}
      data-ui="PopoverContainer"
      $width={Array.isArray(width) ? width : [width]}
      ref={ref}
    />
  )
}
