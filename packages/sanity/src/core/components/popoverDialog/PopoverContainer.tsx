import {
  Container,
  type ContainerProps,
  rem,
useTheme_v2 as useThemeV2} from '@sanity/ui'
 
import {forwardRef, type ReactNode, type Ref, useMemo} from 'react'

import {styledContainer, widthVar} from './PopoverContainer.css'

// This is a workaround to make sure that the Container gets the correct width when used inside a popover.
// The default Container uses `maxWidth` which doesn't work well with popovers because the popover
// calculates its width based on the content width.

interface PopoverContainerProps extends ContainerProps {
  children: ReactNode
}

export const PopoverContainer = forwardRef(function PopoverContainer(
  props: PopoverContainerProps,
  ref: Ref<HTMLDivElement>,
) {
  const {width = [], ...restProps} = props
  const theme = useThemeV2()
  const {container} = theme
  const widthArray = Array.isArray(width) ? width : [width]

  // Compute the width value based on the first responsive width
  const computedWidth = useMemo(() => {
    const val = widthArray[0]
    if (val === undefined || val === 'auto') return 'auto'
    return rem(container[val])
  }, [widthArray, container])

  return (
    <Container
      {...restProps}
      className={styledContainer}
      data-ui="PopoverContainer"
      style={{[widthVar]: computedWidth === 'auto' ? 'none' : computedWidth}}
      ref={ref}
    />
  )
})
