import {_raf2, useRootTheme} from '@sanity/ui'
import {card, scopeClassName as _} from '@sanity/ui/css'
import {type ReactNode, useLayoutEffect} from 'react'

export function HTMLClassNames(): ReactNode {
  const {scheme} = useRootTheme()
  const element = document.documentElement
  const tone = 'transparent'

  useLayoutEffect(() => {
    const els = Array.from(
      document.querySelectorAll([_('button'), _('card'), _('font')].map((n) => `.${n}`).join(', ')),
    )

    // temporarily disable all transitions when the theme changes
    for (const el of els) {
      if (el instanceof HTMLElement) {
        el.style.transition = 'none'
      }
    }

    _raf2(() => {
      document.documentElement.className = card({scheme, tone}) ?? ''

      _raf2(() => {
        for (const el of els) {
          if (el instanceof HTMLElement) {
            el.style.transition = ''
          }
        }
      })
    })

    return () => {
      document.documentElement.className = ''
    }
  }, [element, scheme, tone])

  return null
}
