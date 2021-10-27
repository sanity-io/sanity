import {
  PortableTextEditor,
  PortableTextBlock,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo} from 'react'
import PatchEvent from '../../../PatchEvent'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'
import {RenderBlockActions} from './types'

type BlockActionsProps = {
  block: PortableTextBlock
  onChange: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
  value: PortableTextBlock[] | undefined
}

const noSelectStyle: React.CSSProperties = {userSelect: 'none', display: 'flex'}

export function BlockActions(props: BlockActionsProps) {
  const editor = usePortableTextEditor()
  const {block, onChange, renderBlockActions, value} = props
  const decoratorValues = useMemo(
    () => PortableTextEditor.getPortableTextFeatures(editor).decorators.map((d) => d.value),
    [editor]
  )

  const blockActions = useMemo(() => {
    if (renderBlockActions) {
      const blockActionProps = {
        block,
        value,
        set: createBlockActionPatchFn('set', block, onChange, decoratorValues),
        unset: createBlockActionPatchFn('unset', block, onChange, decoratorValues) as () => void,
        insert: createBlockActionPatchFn('insert', block, onChange, decoratorValues),
      }
      return renderBlockActions(blockActionProps)
    }
    return undefined
  }, [renderBlockActions, block, value, onChange, decoratorValues])

  // Take focus away from the editor so dealing with block actions doesn't interfere with the editor focus
  const handleClick = useCallback(() => {
    PortableTextEditor.blur(editor)
  }, [editor])

  if (!blockActions) {
    return null
  }

  return (
    <div
      style={noSelectStyle}
      contentEditable={false}
      onKeyDown={handleClick}
      onMouseDown={handleClick}
    >
      {blockActions}
    </div>
  )
}
