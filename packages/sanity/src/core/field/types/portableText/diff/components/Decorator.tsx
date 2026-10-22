import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type CSSProperties} from 'react'

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
          ? ({
              [codeFontFamilyVar]: font.code.family,
              [codeBackgroundVar]: color.button.ghost.default.enabled.bg,
            } as CSSProperties)
          : undefined
      }
    >
      {children}
    </span>
  )
}
