import {Card, Code, PortalProvider, Stack, Text, usePortal} from '@sanity/ui'
import {useAction, useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {FIXME} from '../../../../../FIXME'
import {useSource} from '../../../../../studio'
import {EMPTY_ARRAY} from '../../../../../util'
import {createPatchChannel} from '../../../../patch/PatchChannel'
import {ObjectEditData} from '../../types'
import {schema} from './schemaType'

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
    editorPath: undefined,
    focusPath: [{_key: '2'}],
  },
  inlineObject: {
    editorPath: undefined,
    focusPath: [{_key: '1'}, 'children', {_key: '1-3'}],
  },
}

export function EditObjectsStory() {
  const open = useBoolean('Open', false)
  const kind = useSelect('Kind', TYPE_OPTIONS, 'annotation') || 'annotation'

  const portal = usePortal()
  const {form} = useSource()

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
      kind: kind as FIXME,
      returnToSelection: null,
    }),
    [editorPath, focusPath, kind]
  )

  const handleBlur = useAction('onBlur')
  const handleChange = useAction('onChange')
  const handleClose = useAction('onClose')
  const handleFocus = useAction('onFocus')

  const patchChannel = useMemo(() => createPatchChannel(), [])

  const type = schema.get('body')

  if (!type) {
    return (
      <Card height="fill" overflow="auto" tone="critical">
        <Stack padding={4} space={4}>
          <Text weight="bold">"body" type not found</Text>
          <Code language="json" size={1}>
            {JSON.stringify(
              {
                schema: schema._original,
                schemaErrors: schema._validation,
              },
              null,
              2
            )}
          </Code>
        </Stack>
      </Card>
    )
  }

  return (
    <PortalProvider __unstable_elements={{default: portal.element}}>
      {/* <LayerProvider>
        TODO
        <FormBuilderProvider
          __internal_patchChannel={patchChannel}
          onChange={handleChange}
          value={value}
          {...formBuilder}
        >
          <PortableTextEditor onChange={handleChange} type={type as FIXME} value={value}>
            <EditObject
              focusPath={focusPath}
              validation={markers}
              objectEditData={objectEditData}
              onBlur={handleBlur}
              onChange={handleChange}
              onClose={handleClose}
              onFocus={handleFocus}
              presence={presence}
              scrollElement={portal.boundaryElement}
              readOnly={readOnly}
              value={value}
            />
          </PortableTextEditor>
        </FormBuilderProvider>
      </LayerProvider> */}
    </PortalProvider>
  )
}
