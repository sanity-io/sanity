import {Marker} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import {Type} from '../typedefs'
import PatchEvent from '../PatchEvent'

export type Props<T> = {
  type: Type
  level: number
  value: T | null | undefined
  readOnly: boolean | null
  onChange: (patchEvent: PatchEvent) => void
  onFocus: () => void
  onBlur?: () => void
  markers: Marker[]
  presence: FormFieldPresence[]
}
