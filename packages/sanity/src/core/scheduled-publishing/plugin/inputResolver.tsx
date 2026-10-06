import {type InputProps} from '../../form/types/inputProps'
import {ScheduledDocumentInput} from '../components/documentWrapper/ScheduledDocumentInput'

export default function DocumentBannerInput(props: InputProps) {
  const {schemaType} = props
  const rootType = getRootType(schemaType)
  if (rootType.name === 'document') {
    return <ScheduledDocumentInput {...props}>{props.renderDefault(props)}</ScheduledDocumentInput>
  }
  return props.renderDefault(props)
}

function getRootType(type: any): any {
  if (!type.type) {
    return type
  }
  return getRootType(type.type)
}
