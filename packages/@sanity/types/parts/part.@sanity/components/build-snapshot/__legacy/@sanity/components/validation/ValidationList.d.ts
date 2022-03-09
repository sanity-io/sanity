import type {ObjectSchemaType, Path, ValidationMarker} from '_self_'
interface ValidationListProps {
  documentType?: ObjectSchemaType
  kind?: 'simple'
  validation: ValidationMarker[]
  onFocus?: (path: Path) => void
  onClose?: () => void
  truncate?: boolean
}

declare function ValidationList(props: ValidationListProps): JSX.Element

export default ValidationList
