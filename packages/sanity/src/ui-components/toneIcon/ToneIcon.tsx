import {type ThemeColorStateToneKey} from '@sanity/ui/theme'
import {type CSSProperties} from 'react'

type Tone = ThemeColorStateToneKey

export const ToneIcon = ({
  tone,
  icon: Icon,
}: {
  tone: Tone
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}) => {
  return (
    <Icon
      style={
        {
          '--card-icon-color': `var(--card-badge-${tone}-icon-color)`,
        } as CSSProperties
      }
    />
  )
}
