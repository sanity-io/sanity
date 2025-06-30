import {vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'

import {getVarName} from '../../core/css/getVarName'

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
