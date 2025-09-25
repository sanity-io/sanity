import {
  type EditorConfig,
  type EditorEmittedEvent,
  EditorProvider,
  PortableTextEditable,
  useEditor,
} from '@portabletext/editor'
import {EventListenerPlugin, OneLinePlugin} from '@portabletext/editor/plugins'
import {type Path} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useCallback, useEffect, useRef} from 'react'
import {styled} from 'styled-components'

import {useWorkspace} from '../../../../studio/workspace'
import {set, unset} from '../../../patch/patch'
import {type StringInputProps} from '../../../types'
import {UpdateReadOnlyPlugin} from '../../PortableText/PortableTextInput'
import {DeletedSegment} from './diff/segments'
import {useOptimisticDiff} from './diff/useOptimisticDiff'
import {packageValue} from './packageValue'
import {unpackageValue} from './unpackageValue'

export const ROOT_PATH: Path = [{_key: 'root'}, 'children', {_key: 'root'}]
const INVALID_CLASS_NAME = 'invalid'

const StyledRoot = styled.div`
  flex: 1;
  min-width: 0;
  display: block;
  position: relative;
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
  const {advancedVersionControl} = useWorkspace()
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

  const initialConfig = useRef<EditorConfig>({
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
  })

  // const rootTheme = useRootTheme()
  // const fontSize = useArrayProp(2)
  // const padding = useArrayProp(3)
  // const radius = useArrayProp(2)
  // const space = useArrayProp(3)

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
        <span
        // $fontSize={fontSize} $space={space} $padding={padding}
        >
          <DeletedSegment segment={diffSegments[0]} />
        </span>
      )
    }

    return null
  }, [
    diff.fromValue,
    diff.toValue,
    diffSegments,
    // fontSize, space, padding
  ])

  return (
    <StyledRoot>
      <EditorProvider initialConfig={initialConfig.current}>
        <OneLinePlugin />
        <EventListenerPlugin on={handleEditorEvent} />
        <UpdateValuePlugin value={props.value} />
        <UpdateReadOnlyPlugin readOnly={props.readOnly ?? false} />
        <PortableTextEditable
          className={props.validationError ? INVALID_CLASS_NAME : undefined}
          renderPlaceholder={advancedVersionControl.enabled ? renderPlaceholder : undefined}
          rangeDecorations={advancedVersionControl.enabled ? rangeDecorations : undefined}
          // $fontSize={fontSize}
          // $space={space}
          // $padding={padding}
          // $scheme={rootTheme.scheme}
          // $tone={rootTheme.tone}
          // data-scheme={rootTheme.scheme}
          // data-tone={rootTheme.tone}
          data-testid="string-input-portable-text"
        />
      </EditorProvider>
      <Card
        // radius={radius}
        // $scheme={rootTheme.scheme}
        // $tone={rootTheme.tone}
        // data-scheme={rootTheme.scheme}
        // data-tone={rootTheme.tone}
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
