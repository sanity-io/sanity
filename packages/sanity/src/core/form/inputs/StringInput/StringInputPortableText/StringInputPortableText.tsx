import {
  type EditorConfig,
  type EditorEmittedEvent,
  EditorProvider,
  PortableTextEditable,
  defineSchema,
  useEditor,
} from '@portabletext/editor'
import {defineBehavior, forward, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin, EventListenerPlugin} from '@portabletext/editor/plugins'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {type Path} from '@sanity/types'
import {Card, useArrayProp, useRootTheme} from '@sanity/ui'
import {type MutableRefObject, useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {set, unset} from '../../../patch/patch'
import {type StringInputProps} from '../../../types'
import {DeletedSegment} from '../../common/diff/string/segments'
import {stringDiffContainerStyles} from '../../common/diff/string/styles'
import {UpdateReadOnlyPlugin} from '../../PortableText/PortableTextInput'
import {useOptimisticDiff} from './diff/useOptimisticDiff'
import {packageValue} from './packageValue'
import {
  responsiveInputPaddingStyle,
  textInputBaseStyle,
  textInputFontSizeStyle,
  type TextInputInputStyleProps,
  textInputRepresentationStyle,
  type TextInputRepresentationStyleProps,
  type TextInputResponsivePaddingStyleProps,
  textInputRootStyle,
} from './styles'
import {unpackageValue} from './unpackageValue'

export const ROOT_PATH: Path = [{_key: 'root'}, 'children', {_key: 'root'}]
const INVALID_CLASS_NAME = 'invalid'

const StyledRoot = styled.div`
  flex: 1;
  min-width: 0;
  display: block;
  position: relative;
`

const StyledInput = styled(PortableTextEditable)<
  TextInputInputStyleProps & TextInputResponsivePaddingStyleProps
>`
  ${textInputRootStyle}
  ${textInputBaseStyle}
  ${responsiveInputPaddingStyle}
  ${textInputFontSizeStyle}
  ${stringDiffContainerStyles}
`

const StyledEditorRepresentation = styled(Card)<TextInputRepresentationStyleProps>(
  textInputRepresentationStyle,
)

const StyledPlaceholder = styled.span<TextInputResponsivePaddingStyleProps>`
  ${responsiveInputPaddingStyle}
`

/**
 * This string input implementation is powered by the Portable Text Editor. It's used when inline
 * diffs are switched on, but this will likely expand in the future to support features such as
 * presence carets, and eventually become the default/only input component.
 *
 * @hidden
 * @beta
 */
export function StringInputPortableText(props: StringInputProps) {
  const {
    elementProps,
    onChange,
    value: definitiveValue,
    __unstable_computeDiff: computeDiff,
  } = props
  const {onFocus, onBlur, style, ref: focusRef} = elementProps

  const {diff, rangeDecorations, onOptimisticChange} = useOptimisticDiff({
    definitiveValue,
    computeDiff,
  })

  // In Firefox, when the user clicks inside the contenteditable, the browser may redirect
  // focus from a child element to the root element. This causes a rapid blur-then-focus
  // sequence that the PTE relay actor delivers asynchronously. Without debouncing, the
  // spurious blur clears the form's focus state (via onPathBlur), which prevents the field
  // from properly activating on the first click. By deferring the blur callback and
  // cancelling it when a focus event arrives immediately after, we avoid the spurious
  // unfocus cycle.
  const pendingBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up any pending blur timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingBlurRef.current !== null) {
        clearTimeout(pendingBlurRef.current)
      }
    }
  }, [])

  // Belt-and-braces for the Firefox redirect: when the user interacts with the editor,
  // schedule an explicit focus commit through the FocusBridgePlugin. PTE's own onFocus
  // handler bails early in Firefox when the click target is a text node (rather than the
  // editable root) and relies on a follow-up DOM focus event that occasionally isn't
  // delivered reliably. Invoking focusRef.current.focus() here routes through the state
  // machine's "handle focus" action which calls ReactEditor.focus with a selection, and
  // is a no-op if the editor is already focused.
  const handlePointerDown = useCallback(() => {
    requestAnimationFrame(() => {
      focusRef.current?.focus()
    })
  }, [focusRef])

  const handleEditorEvent = useCallback(
    (event: EditorEmittedEvent) => {
      if (event.type === 'focused') {
        // Cancel any pending blur -- this focus supersedes it
        if (pendingBlurRef.current !== null) {
          clearTimeout(pendingBlurRef.current)
          pendingBlurRef.current = null
        }
        onFocus(event.event)
        return
      }

      if (event.type === 'blurred') {
        // Defer blur to allow a subsequent focus event to cancel it. This
        // prevents Firefox's internal focus-redirect from causing a spurious
        // blur that clears the form's focus state.
        pendingBlurRef.current = setTimeout(() => {
          pendingBlurRef.current = null
          onBlur(event.event)
        }, 0)
        return
      }

      // The patch event occurs at the same time as user input, so it can be used to perform actions
      // in tandem with the user's input. e.g. as soon as they type.
      //
      // On patch, set the optimistic value used to create an optimistic diff that can be rendered
      // immediately to reflect the user's input that has not yet been committed.
      if (
        event.type === 'patch' &&
        event.patch.type === 'diffMatchPatch' &&
        event.patch.origin === 'local'
      ) {
        onOptimisticChange(event.patch.value)
        return
      }

      // The mutation event occurs after user input (there is a debounce or throttle period), so it
      // can be used to perform actions that are lower priority than rendering the user's input.
      //
      // On mutation, execute the relevant patches to commit the user's input.
      if (event.type === 'mutation') {
        const value = unpackageValue(event.value)
        const valueRemainsUndefined = typeof definitiveValue === 'undefined' && value === ''
        const valueBecomesUndefined = typeof definitiveValue !== 'undefined' && value === ''
        const valueHasChanged = value !== definitiveValue && !valueRemainsUndefined

        if (!valueHasChanged) {
          return
        }

        if (valueBecomesUndefined) {
          onChange(unset())
          return
        }

        onChange(set(value))
      }
    },
    [onFocus, onBlur, onOptimisticChange, definitiveValue, onChange],
  )

  const [initialConfig] = useState<EditorConfig>(() => ({
    initialValue: packageValue(props.value),
    readOnly: props.readOnly ?? false,
    schemaDefinition: defineSchema({}),
  }))

  const rootTheme = useRootTheme()
  const fontSize = useArrayProp(2)
  const padding = useArrayProp(3)
  const radius = useArrayProp(2)
  const space = useArrayProp(3)

  const diffSegments = diff.type === 'string' ? diff.segments : undefined

  // Range decorations are used to render deleted diff segments. However, rendering a range
  // decoration necessitates that a range actually exists. In the instance that the entire value has
  // been deleted, there is no range to decorate.
  //
  // Instead, the placeholder is used to render the delete diff segment when the entire value has been
  // deleted.
  const renderPlaceholder = useCallback(() => {
    const isEntireValuedDeleted = diff.fromValue && diff.toValue === ''

    if (isEntireValuedDeleted && diffSegments) {
      return (
        <StyledPlaceholder $fontSize={fontSize} $space={space} $padding={padding}>
          <DeletedSegment segment={diffSegments[0]} />
        </StyledPlaceholder>
      )
    }

    return null
  }, [diff.fromValue, diff.toValue, diffSegments, fontSize, space, padding])

  return (
    <StyledRoot>
      <EditorProvider initialConfig={initialConfig}>
        <OneLinePlugin />
        <EventListenerPlugin on={handleEditorEvent} />
        <FocusBridgePlugin focusRef={focusRef} />
        <UpdateValuePlugin value={props.value} />
        <UpdateReadOnlyPlugin readOnly={props.readOnly ?? false} />
        <BehaviorPlugin behaviors={[plainTextPasteBehaviour, plainTextOneLineBehaviour]} />
        <StyledInput
          className={props.validationError ? INVALID_CLASS_NAME : undefined}
          style={style}
          renderPlaceholder={props.displayInlineChanges ? renderPlaceholder : undefined}
          rangeDecorations={props.displayInlineChanges ? rangeDecorations : undefined}
          onPointerDown={handlePointerDown}
          $fontSize={fontSize}
          $space={space}
          $padding={padding}
          $scheme={rootTheme.scheme}
          $tone={rootTheme.tone}
          data-scheme={rootTheme.scheme}
          data-tone={rootTheme.tone}
          data-testid="string-input-portable-text"
        />
      </EditorProvider>
      <StyledEditorRepresentation
        radius={radius}
        $scheme={rootTheme.scheme}
        $tone={rootTheme.tone}
        data-scheme={rootTheme.scheme}
        data-tone={rootTheme.tone}
        data-border
      />
    </StyledRoot>
  )
}

/**
 * `EditorProvider` doesn't have a `value` prop. Instead, this custom PTE
 * plugin listens for the prop change and sends an `update value` event to the
 * editor.
 */
function UpdateValuePlugin(props: {value: string | undefined}) {
  const editor = useEditor()

  useEffect(() => {
    editor.send({
      type: 'update value',
      value: packageValue(props.value),
    })
  }, [editor, props.value])

  return null
}

/**
 * Bridges the `focusRef` from `PrimitiveField` to the PTE editor's `focus()` method.
 *
 * `PrimitiveField` calls `focusRef.current?.focus()` when `member.field.focused` becomes true
 * (e.g. during programmatic focus). Without this bridge, the ref remains unset and the
 * PTE-backed string input never receives focus.
 */
function FocusBridgePlugin(props: {focusRef: MutableRefObject<{focus: () => void} | undefined>}) {
  const editor = useEditor()
  const {focusRef} = props

  useEffect(() => {
    focusRef.current = {focus: () => editor.send({type: 'focus'})}
    return () => {
      focusRef.current = undefined
    }
  }, [editor, focusRef])

  return null
}

/**
 * Convert pasted data to plain text.
 *
 * This is essential to allow pasting of data copied from Portable Text based fields. If pasting
 * Portable Text data was permitted, it would cause a conflict with the expected data structure.
 */
const plainTextPasteBehaviour = defineBehavior({
  on: 'clipboard.paste',
  actions: [
    (event) => [
      raise({
        type: 'insert.text',
        text: event.event.originEvent.dataTransfer.getData('text'),
      }),
    ],
  ],
})

/**
 * Remove new lines from inserted text.
 *
 * This ensures new lines are removed when pasting data copied from Portable Text based fields. Each
 * sequence of new line characters is replaced with a single space character.
 */
const plainTextOneLineBehaviour = defineBehavior({
  on: 'insert.text',
  actions: [
    ({event}) => [
      forward({
        type: 'insert.text',
        text: event.text.replaceAll(/\n+/g, ' '),
      }),
    ],
  ],
})
