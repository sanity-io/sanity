import {type ObjectFieldProps} from '../../../core'
import {type ComponentType} from 'react'

export const VideoField: ComponentType<ObjectFieldProps> = (props) => {
  return props.renderDefault({
    ...props,
    level: props.level - 1,
  })
}
