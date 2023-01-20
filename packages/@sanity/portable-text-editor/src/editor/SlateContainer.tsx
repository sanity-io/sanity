import React, {PropsWithChildren, useEffect, useMemo} from 'react'
import {Slate, withReact} from '@sanity/slate-react'
import {createEditor} from 'slate'
import {PortableTextBlock} from '@sanity/types'
import {KEY_TO_SLATE_ELEMENT, KEY_TO_VALUE_ELEMENT} from '../utils/weakMaps'
import {debugWithName} from '../utils/debug'
import {getValueOrInitialValue, toSlateValue} from '../utils/values'
import {PortableTextEditor} from './PortableTextEditor'
import {withPlugins} from './plugins'

const debug = debugWithName('component:PortableTextEditor:SlateContainer')

export interface SlateContainerProps extends PropsWithChildren {
  editor: PortableTextEditor
  readOnly: boolean
  maxBlocks: number | undefined
  value: PortableTextBlock[] | undefined
}

export function SlateContainer(props: SlateContainerProps) {
  const {editor, readOnly, maxBlocks, value} = props

  // Create the slate instance
  const slateEditor = useMemo(() => {
    debug('Creating new Slate instance')
    const e = withPlugins(withReact(createEditor()), {
      portableTextEditor: editor,
      readOnly,
      maxBlocks,
    })
    KEY_TO_VALUE_ELEMENT.set(e, {})
    KEY_TO_SLATE_ELEMENT.set(e, {})
    return e
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only initial - empty deps here

  // Update the slate instance when plugin dependent props change
  useEffect(() => {
    slateEditor.maxBlocks = maxBlocks
    slateEditor.readOnly = readOnly
    debug('Re-initializing plugin chain')
    withPlugins(slateEditor, {
      portableTextEditor: editor,
      readOnly,
      maxBlocks,
    })
  }, [editor, slateEditor, readOnly, maxBlocks])

  const initialValue = useMemo(
    () =>
      toSlateValue(
        getValueOrInitialValue(value, [
          slateEditor.createPlaceholderBlock(),
        ] as PortableTextBlock[]),
        {
          schemaTypes: editor.schemaTypes,
        },
        KEY_TO_SLATE_ELEMENT.get(slateEditor)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only initial - empty deps here
  )

  useEffect(() => {
    return () => {
      debug('Destroying slateEditor')
      slateEditor.destroy()
    }
  }, [slateEditor])

  return (
    <Slate editor={slateEditor} value={initialValue}>
      {props.children}
    </Slate>
  )
}
