import {LazyContainer} from './LazyContainer'
import {type ComponentType} from 'react'
import {type InputProps} from 'sanity'

const InputB: ComponentType<InputProps> = (props) => (
  <LazyContainer name="Lazy input B">{props.renderDefault(props)}</LazyContainer>
)

export default InputB
