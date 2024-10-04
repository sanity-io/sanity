import {type IconComponent} from '@sanity/icons'
import {type BadgeTone} from '@sanity/ui'
import {createElement, type CSSProperties} from 'react'

export function BadgeIcon(props: {icon: IconComponent; tone: BadgeTone}): JSX.Element {
  const {icon, tone} = props

  return createElement(icon, {
    style: {
      color: `var(--card-badge-${tone}-dot-color)`,
    } as CSSProperties,
  })
}
