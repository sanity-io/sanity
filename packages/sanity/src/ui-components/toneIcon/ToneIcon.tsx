import {getVarName, vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'

export const ToneIcon = ({
  tone,
  icon: Icon,
}: {
  tone: ElementTone
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}) => {
  return (
    <Icon
      style={{
        [getVarName(vars.color.muted.fg)]: vars.color.tinted[tone].fg[4],
      }}
    />
  )
}
