/// <reference types="react" />
import {ObjectSchemaType, Path, Marker} from '_self_'
interface ValidationListProps {
  documentType?: ObjectSchemaType
  kind?: 'simple'
  markers: Marker[]
  onFocus?: (path: Path) => void
  onClose?: () => void
  truncate?: boolean
}
declare function ValidationList(props: ValidationListProps): JSX.Element
export default ValidationList
