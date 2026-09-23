import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'

import {codeBackgroundVar, codeFontFamilyVar, decoration, decoratorWrapper} from './Decorator.css'

function isKnownDecoration(mark: string): mark is keyof typeof decoration {
  return Object.hasOwn(decoration, mark)
}

export function Decorator({mark, children}: {mark: string; children: React.JSX.Element}) {
  const {color, font} = useThemeV2()

  return (
    <span
      className={clsx(decoratorWrapper, isKnownDecoration(mark) && decoration[mark])}
      style={
        mark === 'code'
          ? assignInlineVars({
              [codeFontFamilyVar]: font.code.family,
              [codeBackgroundVar]: color.button.ghost.default.enabled.bg,
            })
          : undefined
      }
    >
      {children}
    </span>
  )
}
