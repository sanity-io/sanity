import {vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'
import {type CSSProperties} from 'react'

export const ToneIcon = ({
  tone,
  icon: Icon,
}: {
  tone: ElementTone
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}) => {
  return (
    <Icon
      style={
        {
          '--card-icon-color': vars.color.tinted[tone].fg[4],
        } as CSSProperties
      }
    />
  )
}
