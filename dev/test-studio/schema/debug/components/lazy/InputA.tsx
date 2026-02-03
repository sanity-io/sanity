import {LazyContainer} from './LazyContainer'
import {type ComponentType} from 'react'
import {type InputProps} from 'sanity'

const InputA: ComponentType<InputProps> = (props) => (
  <LazyContainer name="Lazy input A">{props.renderDefault(props)}</LazyContainer>
)

export default InputA
