import noop from 'lodash-es/noop.js'
import {
  type ComponentType,
  type FulfilledReactPromise,
  type RefObject,
  Suspense,
  use,
  useEffect,
  useRef,
} from 'react'

import {type StringInputProps} from '../../types/inputProps'
import {StringInputBasic} from './StringInputBasic/StringInputBasic'

type StringInputComponent = ComponentType<StringInputProps>
type EditorModule = {StringInputPortableText: StringInputComponent}

let editorLoad: Promise<EditorModule> | undefined

function loadStringInputPortableText(): Promise<EditorModule> {
  if (!editorLoad) {
    const load: Promise<EditorModule> =
      import('./StringInputPortableText/StringInputPortableText').then(
        (module) => {
          // Record the settled state on the promise the way React's `use` reads it, so a load that
          // has already finished renders synchronously instead of suspending for a microtask and
          // swapping the fallback for the editor.
          const settled = load as Promise<EditorModule> &
            Partial<Pick<FulfilledReactPromise<EditorModule>, 'status' | 'value'>>
          settled.status = 'fulfilled'
          settled.value = module
          return module
        },
        (error: unknown) => {
          // Let the next render retry the download instead of caching the failure.
          editorLoad = undefined
          throw error
        },
      )
    editorLoad = load
  }
  return editorLoad
}

/**
 * Starts loading the Portable Text variant of the string input, the one used when
 * `displayInlineChanges` is set. Callers that know a form will render with inline changes
 * (the document pane, the diff view) call this ahead of the form so the fields render the
 * editor directly instead of the plain input followed by a swap.
 *
 * Never rejects: a download that fails here is retried by the next `StringInput` render, where
 * the failure reaches an error boundary instead of being an unhandled rejection.
 *
 * @internal
 */
export function preloadStringInputPortableText(): Promise<void> {
  return loadStringInputPortableText().then(noop, noop)
}

// The inline-changes variant is a Portable Text editor. Importing it statically made every
// string input reach the editor, and through the `StringInput` export every studio download it
// before login. It loads when a string field is first rendered with `displayInlineChanges`;
// the plain input stands in until then, so the field is usable while the editor arrives.
function StringInputInlineChanges(props: StringInputProps) {
  const editorModule = use(loadStringInputPortableText())
  const {focused, elementProps} = props
  const {ref: focusRef} = elementProps

  // If the plain input had focus while the editor was loading, the editor takes it over when it
  // mounts. `PrimitiveField` only focuses on a `focused` transition, and that already happened
  // in the plain input. Child effects run first, so the editor's focus bridge is on the ref here.
  const focusedAtMount = useRef(focused)
  useEffect(() => {
    if (focusedAtMount.current) focusEditor(focusRef)
  }, [focusRef])

  return <editorModule.StringInputPortableText {...props} />
}

function focusEditor(focusRef: RefObject<{focus: () => void} | undefined>): void {
  focusRef.current?.focus()
}

/**
 * @hidden
 * @beta
 */
export function StringInput(props: StringInputProps) {
  if (props.displayInlineChanges) {
    return (
      <Suspense fallback={<StringInputBasic {...props} />}>
        <StringInputInlineChanges {...props} />
      </Suspense>
    )
  }

  return <StringInputBasic {...props} />
}
