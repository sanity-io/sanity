import {useContext} from 'react'
import {TooltipContext} from './tooltipContext'

export function useTooltip() {
  return useContext(TooltipContext)
}
