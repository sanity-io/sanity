import {type StringInputProps} from '../../types/inputProps'
import {StringInputBasic} from './StringInputBasic/StringInputBasic'
import {StringInputPortableText} from './StringInputPortableText/StringInputPortableText'

/**
 * @internal
 */
export function StringInput(props: StringInputProps) {
  if (props.displayInlineChanges) {
    return <StringInputPortableText {...props} />
  }

  return <StringInputBasic {...props} />
}
