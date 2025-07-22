import {
  type EditorConfig,
  type EditorEmittedEvent,
  EditorProvider,
  type Patch,
  PortableTextEditable,
  useEditor,
} from '@portabletext/editor'
import {EventListenerPlugin, OneLinePlugin} from '@portabletext/editor/plugins'
import {type PortableTextBlock} from '@portabletext/react'
import {useCallback, useEffect, useRef} from 'react'

import {diffMatchPatch, SANITY_PATCH_TYPE, set, setIfMissing} from '../patch/patch'
import {type StringInputProps} from '../types'
import {PortableTextMarkersProvider} from './PortableText/contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './PortableText/contexts/PortableTextMembers'
import {EditableCard, EditableWrapper} from './PortableText/Editor.styles'
import {UpdateReadOnlyPlugin} from './PortableText/PortableTextInput'

/**
 *
 * @hidden
 * @beta
 */
export function StringInput(props: StringInputProps) {
  const {validationError, elementProps, onChange} = props
  const {onFocus, onBlur} = elementProps

  const handleEditorEvent = useCallback(
    (event: EditorEmittedEvent) => {
      if (event.type === 'focused') {
        onFocus(event.event)
      }

      if (event.type === 'blurred') {
        onBlur(event.event)
      }

      if (event.type === 'mutation') {
        onChange(set(unpackageValue(event.value)))
      }
    },
    [onBlur, onChange, onFocus],
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

  return (
    <>
      <div style={{outline: '2px solid goldenrod'}}>
        <PortableTextMarkersProvider markers={[]}>
          <PortableTextMemberItemsProvider memberItems={[]}>
            <EditorProvider initialConfig={initialConfig.current}>
              <UpdateReadOnlyPlugin readOnly={props.readOnly ?? false} />
              <UpdateValuePlugin value={props.value} />
              <OneLinePlugin />
              <EventListenerPlugin on={handleEditorEvent} />
              <EditableCard tone={props.readOnly ? 'transparent' : 'default'}>
                <EditableWrapper $isFullscreen={false} $isOneLine>
                  <PortableTextEditable />
                </EditableWrapper>
              </EditableCard>
            </EditorProvider>
          </PortableTextMemberItemsProvider>
        </PortableTextMarkersProvider>
      </div>
    </>
  )
}

function packageValue(value: string | undefined) {
  return [
    {
      _type: 'block',
      _key: 'root',
      children: [
        {
          _type: 'span',
          _key: 'root',
          text: value ?? '',
        },
      ],
    },
  ] satisfies PortableTextBlock[]
}

function unpackageValue(value: PortableTextBlock[] = []): string {
  return (
    value.find(({_key}) => _key === 'root')?.children?.find(({_key}) => _key === 'root')?.text ?? ''
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

function toFormPatches(patches: any) {
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE}))
}
