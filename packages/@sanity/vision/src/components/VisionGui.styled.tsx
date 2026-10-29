import {Card, Label, rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type RefAttributes,
} from 'react'
import {Flex, Box} from 'ui5'

import * as styles from './VisionGui.module.css'

export function Root({
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof Flex> & RefAttributes<HTMLDivElement>) {
  return <Flex {...props} ref={ref} className={styles.root} />
}

export function Header(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={styles.header} />
}

export function StyledLabel(props: ComponentProps<typeof Label>) {
  return <Label {...props} className={styles.styledLabel} />
}

export function SplitpaneContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={styles.splitpaneContainer} />
}

export function QueryRecallPaneContainer(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} flexDirection="column" className={styles.queryRecallPaneContainer} />
}

export function QueryRecallPaneWrapper(props: ComponentProps<typeof Flex>) {
  return (
    <Flex
      {...props}
      flexDirection="column"
      flexBasis="0%"
      flexGrow={1}
      overflow="hidden"
      className={styles.queryRecallPaneWrapper}
    />
  )
}

export function QueryCopyLink(props: ComponentProps<'a'>) {
  return <a {...props} className={styles.queryCopyLink} />
}

export function InputBackgroundContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={styles.inputBackgroundContainer} />
}

export function InputBackgroundContainerLeft(props: ComponentProps<typeof Box>) {
  return (
    <Box
      {...props}
      className={`${styles.inputBackgroundContainer} ${styles.inputBackgroundContainerLeft}`}
    />
  )
}

export function InputContainer(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={styles.inputContainer} />
}

export function ResultOuterContainer(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={styles.resultOuterContainer} />
}

export function ResultInnerContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={styles.resultInnerContainer} />
}

export function ResultContainer({
  isInvalid,
  ...props
}: ComponentProps<typeof Card> & {isInvalid: boolean}) {
  return (
    <Card
      {...props}
      className={
        isInvalid
          ? `${styles.resultContainer} ${styles.resultContainerInvalid}`
          : styles.resultContainer
      }
    />
  )
}

export function Result(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={styles.result} />
}

export function ResultFooter(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={styles.resultFooter} />
}

export function TimingsCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={styles.timingsCard} />
}

interface TimingsTextContainerStyle extends CSSProperties {
  '--vision-timings-text-min-height': string
}

export function TimingsTextContainer(props: ComponentProps<typeof Flex>) {
  const {space, font} = useThemeV2()
  const textSize = font.text.sizes[2]
  const minHeight = rem(
    space[3] * 2 + textSize.lineHeight - textSize.ascenderHeight - textSize.descenderHeight,
  )
  const style: TimingsTextContainerStyle = {'--vision-timings-text-min-height': `${minHeight}`}

  return <Flex {...props} className={styles.timingsTextContainer} style={style} />
}

export function DownloadsCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={styles.downloadsCard} />
}

interface SaveResultLabelStyle extends CSSProperties {
  '--vision-save-result-gap': string
}

export function SaveResultLabel(props: ComponentProps<typeof Text>) {
  const {space} = useThemeV2()
  const style: SaveResultLabelStyle = {'--vision-save-result-gap': `${rem(space[3])}`}

  return <Text {...props} className={styles.saveResultLabel} style={style} />
}

export function ControlsContainer(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={styles.controlsContainer} />
}
