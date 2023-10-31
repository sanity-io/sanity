import {useTheme} from '@sanity/ui'
import React, {PropsWithChildren, useCallback} from 'react'
import {useScratchPad} from '../../hooks/useScratchPad'

export const AssistanceRange = (props: PropsWithChildren) => {
  const theme = useTheme()
  const {onAssistanceRangeSelect} = useScratchPad()
  const color = theme.sanity.color.solid.positive.enabled.bg

  const handleClick = useCallback(() => {
    onAssistanceRangeSelect(null)
  }, [onAssistanceRangeSelect])

  return (
    <span style={{backgroundColor: color, backgroundBlendMode: 'multiply'}} onClick={handleClick}>
      {props.children}
    </span>
  )
}
