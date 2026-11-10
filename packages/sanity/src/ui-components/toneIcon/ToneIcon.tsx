import {type ThemeColorStateToneKey} from '@sanity/ui/theme'
import {type CSSProperties} from 'react'

type Tone = ThemeColorStateToneKey

export const ToneIcon = ({
  tone,
  icon: Icon,
  ...rest
}: {
  tone: Tone
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}) => {
  return (
    <Icon
      {...rest}
      style={
        {
          '--card-icon-color': `var(--card-badge-${tone}-icon-color)`,
          '--icon-color': `var(--card-badge-${tone}-icon-color)`,
        } as CSSProperties
      }
    />
  )
}
