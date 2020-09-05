import {FormFieldPresence} from '@sanity/base/presence'
import {Type, Marker} from '../typedefs'
import PatchEvent from '../PatchEvent'

export type Props = {
  type: Type
  level: number
  value: string | null
  readOnly: boolean | null
  onChange: (arg0: PatchEvent) => void
  onFocus: () => void
  onBlur?: () => void
  markers: Array<Marker>
  presence: FormFieldPresence[]
}
