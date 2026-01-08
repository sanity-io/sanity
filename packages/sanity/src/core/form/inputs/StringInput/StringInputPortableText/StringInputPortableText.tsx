import {
  type EditorConfig,
  type EditorEmittedEvent,
  EditorProvider,
  PortableTextEditable,
  useEditor,
} from '@portabletext/editor'
import {defineBehavior, forward, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin, EventListenerPlugin} from '@portabletext/editor/plugins'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {type Path} from '@sanity/types'
import {Card, useArrayProp, useRootTheme} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
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
  const {onFocus, onBlur} = elementProps

  const {diff, rangeDecorations, onOptimisticChange} = useOptimisticDiff({
    definitiveValue,
    computeDiff,
  })

  const handleEditorEvent = useCallback(
    (event: EditorEmittedEvent) => {
      if (event.type === 'focused') {
        onFocus(event.event)
        return
      }

      if (event.type === 'blurred') {
        onBlur(event.event)
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
    schema: {
      name: 'pteTransformer',
      type: 'array',
      of: [
        {
          type: 'block',
        },
      ],
    },
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
        <UpdateValuePlugin value={props.value} />
        <UpdateReadOnlyPlugin readOnly={props.readOnly ?? false} />
        <BehaviorPlugin behaviors={[plainTextPasteBehaviour, plainTextOneLineBehaviour]} />
        <StyledInput
          className={props.validationError ? INVALID_CLASS_NAME : undefined}
          renderPlaceholder={props.displayInlineChanges ? renderPlaceholder : undefined}
          rangeDecorations={props.displayInlineChanges ? rangeDecorations : undefined}
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
