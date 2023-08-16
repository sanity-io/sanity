import React, {useEffect, useRef} from 'react'
import {useTheme} from '@sanity/ui'
import {HiddenTitle, Root, Title} from './styles'

/**
 * @internal
 */
export interface FormTitleProps {
  title?: string
  isEditingForm?: boolean
}

/**
 *
 * @internal
 */
export function FormTitle({title, isEditingForm}: FormTitleProps) {
  const titleRef = useRef<HTMLDivElement | null>(null)
  const [titleHeight, setTitleHeight] = React.useState<number | undefined>(
    titleRef?.current?.clientHeight
  )
  const {lineHeight} = useTheme().sanity.fonts.heading.sizes[5]

  useEffect(() => {
    setTitleHeight(titleRef?.current?.clientHeight)
  }, [])

  useEffect(() => {
    // If the form is focused then calculate the height of the title using the hidden title
    if (isEditingForm && titleRef.current) {
      const {scrollWidth, clientWidth} = titleRef.current
      const height = Math.ceil(scrollWidth / clientWidth)

      setTitleHeight(height * lineHeight)
    } else {
      // Otherwise reset the height to undefined so it automatically fills the correct position
      setTitleHeight(undefined)
    }
  }, [isEditingForm, lineHeight])

  return (
    <Root marginBottom={4}>
      <Title $muted={!title} $titleHeight={titleHeight} $isEditingForm={isEditingForm}>
        {title ?? 'Untitled'}
      </Title>
      <HiddenTitle ref={titleRef} $isEditingForm={isEditingForm}>
        {title ?? 'Untitled'}
      </HiddenTitle>
    </Root>
  )
}
