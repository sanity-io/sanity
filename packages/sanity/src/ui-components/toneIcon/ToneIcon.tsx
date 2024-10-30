import {type ThemeColorStateToneKey} from '@sanity/ui/theme'
import {type CSSProperties} from 'react'

type Tone = ThemeColorStateToneKey

export const ToneIcon = ({
  tone,
  symbol: Symbol,
}: {
  tone: Tone
  symbol: React.FC<React.SVGProps<SVGSVGElement>>
}) => {
  return (
    <Symbol
      style={
        {
          '--card-icon-color': `var(--card-badge-${tone}-icon-color)`,
        } as CSSProperties
      }
    />
  )
}
