import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

import {codeBgVar, codeFontFamilyVar, decoratorVariants} from './Decorator.css'

export function Decorator({mark, children}: {mark: string; children: React.JSX.Element}) {
  const {font, color} = useThemeV2()

  const vars = useMemo(
    () =>
      mark === 'code'
        ? assignInlineVars({
            [codeFontFamilyVar]: font.code.family,
            [codeBgVar]: color.muted.bg,
          })
        : undefined,
    [mark, font, color],
  )

  const className = (decoratorVariants as Record<string, string>)[mark] || decoratorVariants.default

  return (
    <span className={className} style={vars}>
      {children}
    </span>
  )
}
