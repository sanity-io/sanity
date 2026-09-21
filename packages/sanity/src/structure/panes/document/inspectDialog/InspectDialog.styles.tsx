import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  codeFamilyVar,
  codeFontSizeVar,
  codeLineHeightVar,
  jsonInspectorWrapper,
  space3Var,
  space4HalfVar,
  space4Var,
  syntaxBooleanVar,
  syntaxConstantVar,
  syntaxNumberVar,
  syntaxPropertyVar,
  syntaxStringVar,
} from './InspectDialog.css'

export function JSONInspectorWrapper(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {color, font, space} = useThemeV2()
  const codeSize = font.code.sizes[1]

  return (
    <div
      {...rest}
      className={clsx(jsonInspectorWrapper, className)}
      style={{
        ...assignInlineVars({
          [codeFamilyVar]: font.code.family,
          [codeFontSizeVar]: `${codeSize.fontSize}px`,
          [codeLineHeightVar]: `${codeSize.lineHeight}px`,
          [space3Var]: `${rem(space[3])}`,
          [space4Var]: `${rem(space[4])}`,
          [space4HalfVar]: `${rem(space[4] / 2)}`,
          [syntaxPropertyVar]: color.syntax.property,
          [syntaxConstantVar]: color.syntax.constant,
          [syntaxStringVar]: color.syntax.string,
          [syntaxBooleanVar]: color.syntax.boolean,
          [syntaxNumberVar]: color.syntax.number,
        }),
        ...style,
      }}
    />
  )
}
