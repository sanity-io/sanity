import {type ComponentType} from 'react'

import {type ObjectFieldProps} from '../../../core'

export const VideoField: ComponentType<ObjectFieldProps> = (props) => {
  return props.renderDefault({
    ...props,
    level: props.level - 1,
  })
}
