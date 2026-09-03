import {Flex, Stack} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {RatioBox} from '../ImageInput/ImagePreview.styled'
import {cardWrapper, codeWrapper, flexWrapper, leftSection} from './UploadProgress.css'

export function CardWrapper(props: ComponentProps<typeof RatioBox>) {
  const {className, ...rest} = props
  return <RatioBox {...rest} className={clsx(cardWrapper, className)} />
}

export function FlexWrapper(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(flexWrapper, className)} />
}

export function LeftSection(props: ComponentProps<typeof Stack>) {
  const {className, ...rest} = props
  return <Stack {...rest} className={clsx(leftSection, className)} />
}

export function CodeWrapper(props: ComponentProps<typeof Code>) {
  const {className, ...rest} = props
  return <Code {...rest} className={clsx(codeWrapper, className)} />
}
