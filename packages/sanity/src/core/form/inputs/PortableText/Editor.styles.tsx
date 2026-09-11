import {Card, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {ScrollContainer} from '../../../components/scroll/scrollContainer'
import {
  container1Var,
  editableCard,
  editableWrapper,
  editorPaddingBottomVar,
  gutterRemVar,
  gutterVar,
  radius2Var,
  root,
  rootOneLine,
  scroller,
  space2Var,
  space3Var,
  toolbarCard,
} from './Editor.styles.css'

export function Root(props: ComponentProps<typeof Card> & {$isOneLine: boolean}) {
  const {$isOneLine, className, ...rest} = props
  return <Card {...rest} className={clsx(root, $isOneLine && rootOneLine, className)} />
}

export function ToolbarCard(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(toolbarCard, className)} />
}

export function EditableCard(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(editableCard, className)} />
}

export function Scroller(props: ComponentProps<typeof ScrollContainer>) {
  const {className, ...rest} = props
  return <ScrollContainer {...rest} className={clsx(scroller, className)} />
}

export function EditableWrapper(
  props: ComponentProps<typeof Card> & {$isFullscreen: boolean; $isOneLine: boolean},
) {
  const {$isFullscreen, $isOneLine, className, style, ...rest} = props
  const {container, radius, space} = useThemeV2()
  const gutter = space[$isFullscreen ? 5 : 3]

  return (
    <Card
      {...rest}
      className={clsx(editableWrapper, className)}
      style={{
        ...assignInlineVars({
          [space2Var]: `${space[2]}px`,
          [space3Var]: `${space[3]}px`,
          [radius2Var]: `${radius[2]}px`,
          [container1Var]: `${container[1]}px`,
          [gutterVar]: `${gutter}px`,
          [gutterRemVar]: String(rem(gutter)),
          [editorPaddingBottomVar]: $isOneLine ? '0px' : `${space[$isFullscreen ? 9 : 5]}px`,
        }),
        ...style,
      }}
    />
  )
}
