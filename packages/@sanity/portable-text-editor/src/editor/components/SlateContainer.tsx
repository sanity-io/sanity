import React, {PropsWithChildren, useEffect, useMemo} from 'react'
import {Slate, withReact} from '@sanity/slate-react'
import {createEditor} from 'slate'
import {PortableTextBlock} from '@sanity/types'
import {KEY_TO_SLATE_ELEMENT, KEY_TO_VALUE_ELEMENT} from '../../utils/weakMaps'
import {debugWithName} from '../../utils/debug'
import {PatchObservable} from '../../types/editor'
import {toSlateValue} from '../../utils/values'
import {PortableTextEditor} from '../PortableTextEditor'
import {withPlugins} from '../plugins'

const debug = debugWithName('component:PortableTextEditor:SlateContainer')

/**
 * @internal
 */
export interface SlateContainerProps extends PropsWithChildren {
  isPending: React.MutableRefObject<boolean | null>
  keyGenerator: () => string
  maxBlocks: number | undefined
  patches$?: PatchObservable
  portableTextEditor: PortableTextEditor
  readOnly: boolean
  value: PortableTextBlock[] | undefined
}

/**
 * Sets up and encapsulates the Slate instance
 * @internal
 */
export function SlateContainer(props: SlateContainerProps) {
  const {patches$, portableTextEditor, readOnly, maxBlocks, keyGenerator, value, isPending} = props

  // Create the slate instance
  const [slateEditor, subscribe] = useMemo(() => {
    debug('Creating new Slate editor instance')
    const {editor, subscribe: _sub} = withPlugins(withReact(createEditor()), {
      isPending,
      keyGenerator,
      maxBlocks,
      patches$,
      portableTextEditor,
      readOnly,
    })
    KEY_TO_VALUE_ELEMENT.set(editor, {})
    KEY_TO_SLATE_ELEMENT.set(editor, {})
    return [editor, _sub]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only initial - empty deps here

  useEffect(() => {
    const unsubscribe = subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe])

  // Update the slate instance when plugin dependent props change.
  useEffect(() => {
    debug('Re-initializing plugin chain')
    withPlugins(slateEditor, {
      isPending,
      keyGenerator,
      maxBlocks,
      patches$,
      portableTextEditor,
      readOnly,
    })
  }, [keyGenerator, portableTextEditor, maxBlocks, readOnly, patches$, slateEditor, isPending])

  const initialValue = useMemo(
    () =>
      value
        ? toSlateValue(value, {schemaTypes: portableTextEditor.schemaTypes}, KEY_TO_SLATE_ELEMENT)
        : [slateEditor.createPlaceholderBlock()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only initial
  )

  useEffect(() => {
    return () => {
      debug('Destroying Slate editor')
      slateEditor.destroy()
    }
  }, [slateEditor])

  return (
    <Slate editor={slateEditor} value={initialValue}>
      {props.children}
    </Slate>
  )
}
