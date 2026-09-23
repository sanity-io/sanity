import {lazy, Suspense} from 'react'

import {type StringInputProps} from '../../types/inputProps'
import {StringInputBasic} from './StringInputBasic/StringInputBasic'

// The inline-changes variant is a Portable Text editor. Importing it statically made every
// string input reach the editor, and through the `StringInput` export every studio download it
// before login. It loads when a string field is first rendered with `displayInlineChanges`;
// a read-only plain input stands in until then so the value and layout are in place. It must
// not be editable: resolving the chunk unmounts it, and an edit in progress would lose focus,
// caret position and any IME composition in the swap.
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
      <Suspense
        fallback={
          <StringInputBasic {...props} elementProps={{...props.elementProps, readOnly: true}} />
        }
      >
        <StringInputPortableText {...props} />
      </Suspense>
    )
  }

  return <StringInputBasic {...props} />
}
