import {Button} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {AnimatedSparklesIcon} from './AnimatedSparklesIcon'

export interface GenerateQueryButtonProps extends Omit<
  ComponentProps<typeof Button>,
  'icon' | 'mode' | 'text' | 'tone'
> {
  /** Visible label next to the sparkles icon */
  text: string
}

/**
 * Opens the generate-query bar. Labelled (not icon-only), with twinkling sparkles
 * so the Agent Actions entry point stays discoverable in the query editor chrome.
 * The remaining props reach the `Button`, so a wrapping `Tooltip` can attach its
 * ref and handlers.
 */
export function GenerateQueryButton(props: GenerateQueryButtonProps) {
  const {text, ...rest} = props

  return (
    <Button
      data-testid="vision-generate-query"
      fontSize={1}
      padding={2}
      {...rest}
      icon={AnimatedSparklesIcon}
      mode="bleed"
      text={text}
      tone="primary"
    />
  )
}
