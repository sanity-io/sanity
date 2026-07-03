import {type ComponentProps} from 'react'

import {svgWrapper} from './ConnectorsOverlay.css'

export function SvgWrapper(props: ComponentProps<'svg'>) {
  return <svg {...props} className={svgWrapper} />
}
