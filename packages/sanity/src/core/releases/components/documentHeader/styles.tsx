import {
  Button, // oxlint-disable-line no-restricted-imports
} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {chipButton, chipButtonContainer} from './styles.css'

export function ChipButtonContainer(props: ComponentProps<'span'>) {
  const {className, ...rest} = props
  return <span {...rest} className={clsx(chipButtonContainer, className)} />
}

export function ChipButton(props: ComponentProps<typeof Button>) {
  const {className, ...rest} = props
  return <Button {...rest} className={clsx(chipButton, className)} />
}
