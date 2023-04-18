import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {PortableTextBlock} from '@sanity/types'
import {PatchEvent} from '../../patch'
import {RenderBlockActionsCallback, RenderBlockActionsProps} from './types'
import {createInsertCallback, createSetCallback, createUnsetCallback} from './callbacks'

interface BlockActionsProps {
  block: PortableTextBlock
  onChange: (patches: PatchEvent) => void
  renderBlockActions?: RenderBlockActionsCallback
}

const Root = styled.div`
  display: flex;
  pointer-events: all;
`

export function BlockActions(props: BlockActionsProps) {
  const editor = usePortableTextEditor()
  const {block, onChange, renderBlockActions} = props
  const decoratorValues = useMemo(() => editor.schemaTypes.decorators.map((d) => d.value), [editor])

  const blockActions = useMemo(() => {
    if (renderBlockActions) {
      const blockActionProps: RenderBlockActionsProps = {
        block,
        value: PortableTextEditor.getValue(editor),
        set: createSetCallback({allowedDecorators: decoratorValues, block, onChange}),
        unset: createUnsetCallback({block, onChange}),
        insert: createInsertCallback({allowedDecorators: decoratorValues, block, onChange}),
      }
      return renderBlockActions(blockActionProps)
    }
    return undefined
  }, [renderBlockActions, block, editor, onChange, decoratorValues])

  // Don't render anything if the renderBlockActions function returns null.
  // Note that if renderBlockComponent is a React class, this will never be the case.
  if (!blockActions) return null

  return <Root contentEditable={false}>{blockActions}</Root>
}
