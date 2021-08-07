/// <reference types="react" />
import {Marker, Path} from '_self_'
interface ValidationListItemProps {
  hasFocus?: boolean
  kind?: 'simple'
  marker: Marker
  onClick?: (path?: Path) => void
  path: string
  truncate?: boolean
}
declare function ValidationListItem(props: ValidationListItemProps): JSX.Element
export default ValidationListItem
