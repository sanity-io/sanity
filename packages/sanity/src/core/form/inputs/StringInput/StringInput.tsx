import {lazy, Suspense} from 'react'

import {type StringInputProps} from '../../types'
import {StringInputBasic} from './StringInputBasic/StringInputBasic'

const LazyStringInputPortableText = lazy(() =>
  import('./StringInputPortableText/StringInputPortableText').then((mod) => ({
    default: mod.StringInputPortableText,
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
        <LazyStringInputPortableText {...props} />
      </Suspense>
    )
  }

  return <StringInputBasic {...props} />
}
