import {lazy, Suspense} from 'react'

import {type StringInputProps} from '../../types/inputProps'
import {StringInputBasic} from './StringInputBasic/StringInputBasic'

// The inline-changes variant is a Portable Text editor. Importing it statically made every
// string input reach the editor, and through the `StringInput` export every studio download it
// before login. It loads when a string field is first rendered with `displayInlineChanges`;
// the plain input stands in until then, so the field is usable while the editor arrives.
const StringInputPortableText = lazy(() =>
  import('./StringInputPortableText/StringInputPortableText').then((module) => ({
    default: module.StringInputPortableText,
  })),
)

/**
 * @hidden
 * @beta
 */
export function StringInput(props: StringInputProps) {
  if (props.displayInlineChanges) {
    return (
      <Suspense fallback={<StringInputBasic {...props} />}>
        <StringInputPortableText {...props} />
      </Suspense>
    )
  }

  return <StringInputBasic {...props} />
}
