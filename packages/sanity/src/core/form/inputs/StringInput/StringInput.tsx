import type {StringInputProps} from '../../types/inputProps'
import {StringInputBasic} from './StringInputBasic/StringInputBasic'
import {StringInputPortableText} from './StringInputPortableText/StringInputPortableText'

/**
 * @hidden
 * @beta
 */
export function StringInput(props: StringInputProps) {
  if (props.displayInlineChanges) {
    return <StringInputPortableText {...props} />
  }

  return <StringInputBasic {...props} />
}
