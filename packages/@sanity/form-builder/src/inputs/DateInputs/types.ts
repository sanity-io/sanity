import {Marker} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import PatchEvent from '../../PatchEvent'

export type ParseResult = {isValid: boolean; date?: Date; error?: string} & (
  | {isValid: true; date: Date}
  | {isValid: false; error?: string}
  )
export type CommonProps = {
  value: string
  markers: Marker[]
  readOnly: boolean | null
  onChange: (event: PatchEvent) => void
  level: number
  onFocus: () => void
  presence: FormFieldPresence[]
}
