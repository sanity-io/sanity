import React, {useLayoutEffect, useRef} from 'react'
import {ElementQuery} from '@sanity/ui'
import {Root, Title} from './styles'

/**
 * @internal
 */
export interface FormTitleProps {
  title?: string
  ready?: boolean
}

/**
 *
 * @internal
 */
export function FormTitle({title, ready}: FormTitleProps) {
  const titleRef = useRef<HTMLDivElement | null>(null)
  const [titleHeight, setTitleHeight] = React.useState<number | undefined>()

  useLayoutEffect(() => {
    // if it's not ready and titleHeight is already set return
    if (!ready || titleHeight) {
      return
    }

    setTitleHeight(titleRef?.current?.clientHeight)
  }, [ready, titleHeight])

  return (
    <Root marginBottom={4}>
      <ElementQuery>
        <Title ref={titleRef} $muted={!title} $titleHeight={titleHeight}>
          {title ?? 'Untitled'}
        </Title>
      </ElementQuery>
    </Root>
  )
}
