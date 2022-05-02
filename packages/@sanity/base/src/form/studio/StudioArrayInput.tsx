import {ObjectInputProps, RenderItemCallback} from '../types'
import React, {useCallback} from 'react'
import {assertType} from '../utils/asserters'
import {ChangeIndicatorProvider} from '../../components/changeIndicators'

export function StudioArrayInput(props: any) {
  // const renderItem: RenderItemCallback = useCallback(
  //   (item) => {
  //     const Input = resolveInputComponent(item.schemaType)
  //     if (!Input) {
  //       return <div>No input resolved for type: {item.schemaType.name}</div>
  //     }
  //     assertType<React.ComponentType<ObjectInputProps>>(Input)
  //     return (
  //       <ChangeIndicatorProvider path={item.path} value={item.value} compareValue={undefined}>
  //         <Input {...item.inputProps} renderField={renderField} />
  //       </ChangeIndicatorProvider>
  //     )
  //   },
  //   [renderField, resolveInputComponent]
  // )
  return <div>Todo</div>
}
