import {vars} from '@sanity/ui/css'
import {type Radius} from '@sanity/ui/theme'
import {type ComponentType} from 'react'
import {css, styled} from 'styled-components'

export function withFocusRing<Props>(component: ComponentType<Props>) {
  return styled(component)<Props & {$border?: boolean; $radius?: Radius}>((props) => {
    const {$border, $radius = 1} = props

    return css`
      /* --card-focus-box-shadow:  */

      border-radius: ${vars.radius[$radius]};
      outline: none;
      box-shadow: var(--card-focus-box-shadow);

      &:focus {
        /* TODO */
      }
    `
  })
}
