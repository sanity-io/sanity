import {type ComponentType} from 'react'
import {type InputProps} from 'sanity'

import {LazyContainer} from './LazyContainer'

const InputA: ComponentType<InputProps> = (props) => (
  <LazyContainer name="Lazy input A">{props.renderDefault(props)}</LazyContainer>
)

export default InputA
