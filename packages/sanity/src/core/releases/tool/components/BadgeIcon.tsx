import {type IconComponent} from '@sanity/icons'
import {type BadgeTone} from '@sanity/ui'
import {createElement, type CSSProperties} from 'react'

export function BadgeIcon(props: {icon: IconComponent; tone: BadgeTone}) {
  const {icon, tone} = props

  return createElement(icon, {
    style: {
      '--card-icon-color': `var(--card-badge-${tone}-icon-color)`,
    } as CSSProperties,
  })
}
