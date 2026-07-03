import {Box, Card, Flex, Label, rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentProps, type ComponentPropsWithoutRef, forwardRef} from 'react'

import {
  controlsContainer,
  downloadsCard,
  header,
  inputBackgroundContainer,
  inputBackgroundContainerLeft,
  inputContainer,
  queryCopyLink,
  result,
  resultContainer,
  resultContainerInvalid,
  resultFooter,
  resultInnerContainer,
  resultOuterContainer,
  root,
  saveResultLabel,
  saveResultSpanGapVar,
  splitpaneContainer,
  styledLabel,
  timingsCard,
  timingsTextContainer,
  timingsTextMinHeightVar,
} from './VisionGui.css'

export const Root = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof Flex>>(
  function Root(props, ref) {
    return <Flex {...props} ref={ref} className={root} />
  },
)

export function Header(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={header} />
}

export function StyledLabel(props: ComponentProps<typeof Label>) {
  return <Label {...props} className={styledLabel} />
}

export function SplitpaneContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={splitpaneContainer} />
}

export function QueryCopyLink(props: ComponentProps<'a'>) {
  return <a {...props} className={queryCopyLink} />
}

export function InputBackgroundContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={inputBackgroundContainer} />
}

export function InputBackgroundContainerLeft(props: ComponentProps<typeof Box>) {
  return (
    <Box {...props} className={`${inputBackgroundContainer} ${inputBackgroundContainerLeft}`} />
  )
}

export function InputContainer(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={inputContainer} />
}

export function ResultOuterContainer(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={resultOuterContainer} />
}

export function ResultInnerContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={resultInnerContainer} />
}

export function ResultContainer({
  isInvalid,
  ...props
}: ComponentProps<typeof Card> & {isInvalid: boolean}) {
  return (
    <Card
      {...props}
      className={isInvalid ? `${resultContainer} ${resultContainerInvalid}` : resultContainer}
    />
  )
}

export function Result(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={result} />
}

export function ResultFooter(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={resultFooter} />
}

export function TimingsCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={timingsCard} />
}

export function TimingsTextContainer(props: ComponentProps<typeof Flex>) {
  const {space, font} = useThemeV2()
  const textSize = font.text.sizes[2]
  const minHeight = rem(
    space[3] * 2 + textSize.lineHeight - textSize.ascenderHeight - textSize.descenderHeight,
  )

  return (
    <Flex
      {...props}
      className={timingsTextContainer}
      style={assignInlineVars({[timingsTextMinHeightVar]: `${minHeight}`})}
    />
  )
}

export function DownloadsCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={downloadsCard} />
}

export function SaveResultLabel(props: ComponentProps<typeof Text>) {
  const {space} = useThemeV2()

  return (
    <Text
      {...props}
      className={saveResultLabel}
      style={assignInlineVars({[saveResultSpanGapVar]: `${rem(space[3])}`})}
    />
  )
}

export function ControlsContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={controlsContainer} />
}
