import {LazyContainer} from './LazyContainer'
import {type ComponentType} from 'react'
import {type FieldProps} from 'sanity'

const FieldA: ComponentType<FieldProps> = (props) => (
  <LazyContainer name="Lazy field A">{props.renderDefault(props)}</LazyContainer>
)

export default FieldA
