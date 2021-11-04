import {PortableTextEditor} from '@sanity/portable-text-editor'
import {LayerProvider, PortalProvider, usePortal} from '@sanity/ui'
import {useAction, useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import FormBuilderContext from '../../../../FormBuilderContext'
import {EditObject} from '../../object'
import {ObjectEditData} from '../../types'
import {resolveInputComponent, resolvePreviewComponent} from './formBuilder'
import {schema, schemaType} from './schemaType'

const TYPE_OPTIONS: Record<string, 'annotation' | 'blockObject' | 'inlineObject'> = {
  Annotation: 'annotation',
  'Object block': 'blockObject',
  'Inline object': 'inlineObject',
}

const TYPE_DATA = {
  annotation: {
    editorPath: [{_key: '1'}, 'children', {_key: '1-2'}],
    focusPath: [{_key: '1'}, 'markDefs', {_key: 'm1'}],
  },
  blockObject: {
    focusPath: [{_key: '2'}],
  },
  inlineObject: {
    focusPath: [{_key: '1'}, 'children', {_key: '1-3'}],
  },
}

const EMPTY_ARRAY: any[] = []

export function EditObjectsStory() {
  const open = useBoolean('Open', false)
  const kind = useSelect('Kind', TYPE_OPTIONS, 'annotation')

  const portal = usePortal()

  const {editorPath, focusPath} = useMemo(() => {
    if (!open) {
      return {
        editorPath: EMPTY_ARRAY,
        focusPath: EMPTY_ARRAY,
      }
    }

    return {
      editorPath: TYPE_DATA[kind]?.editorPath || TYPE_DATA[kind]?.focusPath || EMPTY_ARRAY,
      focusPath: TYPE_DATA[kind]?.focusPath || EMPTY_ARRAY,
    }
  }, [kind, open])

  const markers = useMemo(() => [], [])
  const presence = useMemo(() => [], [])
  const readOnly = false
  const value = useMemo(
    () => [
      {
        _type: 'block',
        _key: '1',
        children: [
          {
            _type: 'span',
            _key: '1-1',
            text: 'test',
          },
          {
            _type: 'span',
            _key: '1-2',
            text: 'annotation',
            marks: ['m1'],
          },
          {
            _type: 'myInlineObject',
            _key: '1-3',
            title: 'The inline object',
          },
        ],
        markDefs: [
          {
            _type: 'link',
            _key: 'm1',
            url: 'test',
          },
        ],
      },
      {
        _type: 'myObjectBlock',
        _key: '2',
      },
    ],
    []
  )

  const objectEditData: ObjectEditData = useMemo(
    () => ({
      editorPath,
      formBuilderPath: focusPath,
      kind: kind as any,
      returnToSelection: null,
    }),
    [editorPath, focusPath, kind]
  )

  const handleBlur = useAction('onBlur')
  const handleChange = useAction('onChange')
  const handleClose = useAction('onClose')
  const handleFocus = useAction('onFocus')

  const patchChannel = useMemo(() => {
    return {onPatch: () => () => undefined}
  }, [])

  return (
    <PortalProvider __unstable_elements={{default: portal.element}}>
      <LayerProvider>
        <FormBuilderContext
          value={value}
          patchChannel={patchChannel}
          schema={schema}
          resolveInputComponent={resolveInputComponent}
          resolvePreviewComponent={resolvePreviewComponent}
        >
          <PortableTextEditor onChange={handleChange} type={schemaType} value={value}>
            <EditObject
              focusPath={focusPath}
              markers={markers}
              objectEditData={objectEditData}
              onBlur={handleBlur}
              onChange={handleChange}
              onClose={handleClose}
              onFocus={handleFocus}
              presence={presence}
              readOnly={readOnly}
              value={value}
            />
          </PortableTextEditor>
        </FormBuilderContext>
      </LayerProvider>
    </PortalProvider>
  )
}
