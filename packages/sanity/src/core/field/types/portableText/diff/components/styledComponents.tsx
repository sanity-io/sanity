import {Text} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Box} from 'ui5'

import {inlineBox, inlineText, popoverContainer, previewContainer} from './styledComponents.css'

export function InlineBox(props: ComponentProps<typeof Box>) {
  const {className, ...rest} = props

  return <Box {...rest} className={clsx(inlineBox, className)} />
}

export function InlineText(props: ComponentProps<typeof Text>) {
  const {className, ...rest} = props

  return <Text {...rest} className={clsx(inlineText, className)} />
}

export function PreviewContainer(props: ComponentProps<typeof Box>) {
  const {className, ...rest} = props

  return <Box {...rest} className={clsx(previewContainer, className)} />
}

export function PopoverContainer(props: ComponentProps<typeof Box>) {
  const {className, ...rest} = props

  return <Box {...rest} className={clsx(popoverContainer, className)} />
}
