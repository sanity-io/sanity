import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Flex} from 'ui5'

import {flexWrapper, innerBox} from './FieldPresence.styled.css'

export function FlexWrapper(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(flexWrapper, className)} />
}

export function InnerBox(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(innerBox, className)} />
}
