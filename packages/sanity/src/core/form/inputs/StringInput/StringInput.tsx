import {useWorkspace} from '../../../studio/workspace'
import {type StringInputProps} from '../../types'
import {StringInputBasic} from './StringInputBasic/StringInputBasic'
import {StringInputPortableText} from './StringInputPortableText/StringInputPortableText'

/**
 * @hidden
 * @beta
 */
export function StringInput(props: StringInputProps) {
  const {advancedVersionControl} = useWorkspace()

  if (advancedVersionControl?.enabled) {
    return <StringInputPortableText {...props} />
  }

  return <StringInputBasic {...props} />
}
