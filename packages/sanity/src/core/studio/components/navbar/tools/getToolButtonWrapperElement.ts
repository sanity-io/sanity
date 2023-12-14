import React, {Fragment} from 'react'
import {isValidElementType} from 'react-is'
import {Tool} from '../../../../config'

export function getToolButtonWrapperElement(tool: Tool): React.ElementType {
  const wrapperOption = tool?.options?.__internal_toolMenuButtonWrapper
  const isValid = isValidElementType(wrapperOption)
  const Wrapper = isValid ? wrapperOption : Fragment

  return Wrapper
}
