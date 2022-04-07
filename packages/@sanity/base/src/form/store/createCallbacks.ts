import {ObjectSchemaType} from '@sanity/types'
import {PatchEvent} from '../patch'

type OnChangeCallback = (event: PatchEvent) => void

interface OnChangeHandlers {
  onChange: OnChangeCallback
  children: {[key: string]: OnChangeHandlers}
}
