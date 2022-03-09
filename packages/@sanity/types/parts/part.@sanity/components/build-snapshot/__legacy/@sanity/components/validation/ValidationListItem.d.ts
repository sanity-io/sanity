import type {ValidationMarker, Path} from '_self_'
interface ValidationListItemProps {
  hasFocus?: boolean
  kind?: 'simple'
  marker: ValidationMarker
  onClick?: (path?: Path) => void
  path: string
  truncate?: boolean
}

declare function ValidationListItem(props: ValidationListItemProps): JSX.Element

export default ValidationListItem
