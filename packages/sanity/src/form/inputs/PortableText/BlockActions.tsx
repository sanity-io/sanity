import {
  PortableTextEditor,
  PortableTextBlock,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo} from 'react'
import styled from 'styled-components'
import {PatchArg} from '../../patch'
import {RenderBlockActionsCallback, RenderBlockActionsProps} from './types'
import {createInsertCallback, createSetCallback, createUnsetCallback} from './callbacks'

interface BlockActionsProps {
  block: PortableTextBlock
  onChange: (...patches: PatchArg[]) => void
  renderBlockActions?: RenderBlockActionsCallback
}

const Root = styled.div`
  display: flex;
  pointer-events: 'all';
`

// function isClassComponent(component: React.ComponentType) {
//   return typeof component === 'function' && !!component.prototype?.isReactComponent
// }

// function isFunctionComponent(component: React.ComponentType) {
//   return typeof component === 'function' && String(component).includes('return React.createElement')
// }

export function BlockActions(props: BlockActionsProps) {
  const editor = usePortableTextEditor()
  const {block, onChange, renderBlockActions} = props
  const decoratorValues = useMemo(
    () => PortableTextEditor.getPortableTextFeatures(editor).decorators.map((d) => d.value),
    [editor]
  )

  const blockActions = useMemo(() => {
    if (renderBlockActions) {
      const blockActionProps: RenderBlockActionsProps = {
        block,
        value: PortableTextEditor.getValue(editor),
        set: createSetCallback({allowedDecorators: decoratorValues, block, onChange}),
        unset: createUnsetCallback({block, onChange}),
        insert: createInsertCallback({allowedDecorators: decoratorValues, block, onChange}),
      }

      // // Support returning a class component for renderBlockActions (to keep backward compatability as it was possible before)
      // if (isClassComponent(renderBlockActions) || isFunctionComponent(renderBlockActions)) {
      //   const RenderComponent = renderBlockActions
      //   return <RenderComponent {...blockActionProps} />
      // }
      return renderBlockActions(blockActionProps)
    }
    return undefined
  }, [renderBlockActions, block, editor, onChange, decoratorValues])

  // Take focus away from the editor so dealing with block actions doesn't interfere with the editor focus
  const handleClick = useCallback(() => {
    PortableTextEditor.blur(editor)
  }, [editor])

  // Don't render anything if the renderBlockActions function returns null.
  // Note that if renderBlockComponent is a React class, this will never be the case.
  if (!blockActions) return null

  return (
    <Root contentEditable={false} onKeyDown={handleClick} onMouseDown={handleClick}>
      {blockActions}
    </Root>
  )
}
