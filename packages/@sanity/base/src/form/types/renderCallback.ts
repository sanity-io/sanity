import {FieldSetProps} from './fieldsetProps'
import {InputProps} from './inputProps'
import {Focusable} from './focusable'
import {ItemProps} from './itemProps'

export type RenderFieldCallback = (inputProps: InputProps) => React.ReactNode

export type RenderArrayItemCallback = (itemProps: ItemProps, itemRef: Focusable) => React.ReactNode

export type RenderFieldSetCallback = (
  renderFieldSetProps: RenderFieldSetCallbackArg
) => React.ReactNode

export type RenderFieldSetCallbackArg = FieldSetProps & {
  children?: React.ReactNode
}
