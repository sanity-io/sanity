import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {type PortableTextBlock} from '@sanity/types'
import {useMemo} from 'react'

import {type PatchEvent} from '../../patch/PatchEvent'
import {
  type RenderBlockActionsCallback,
  type RenderBlockActionsProps,
} from '../../types/_transitional'
import {root} from './BlockActions.css'
import {createInsertCallback} from './callbacks/insertCallback'
import {createSetCallback} from './callbacks/setCallback'
import {createUnsetCallback} from './callbacks/unsetCallback'

interface BlockActionsProps {
  block: PortableTextBlock
  onChange: (patches: PatchEvent) => void
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  renderBlockActions?: RenderBlockActionsCallback
}

export function BlockActions(props: BlockActionsProps) {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editor = usePortableTextEditor()
  const {block, onChange, renderBlockActions} = props
  const blockActions = useMemo(() => {
    if (renderBlockActions) {
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      const blockActionProps: RenderBlockActionsProps = {
        block,
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        value: PortableTextEditor.getValue(editor),
        set: createSetCallback({block, onChange}),
        unset: createUnsetCallback({block, onChange}),
        insert: createInsertCallback({block, onChange}),
      }
      return renderBlockActions(blockActionProps)
    }
    return undefined
  }, [renderBlockActions, block, editor, onChange])

  // Don't render anything if the renderBlockActions function returns null.
  // Note that if renderBlockComponent is a React class, this will never be the case.
  if (!blockActions) return null

  return (
    <div className={root} contentEditable={false}>
      {blockActions}
    </div>
  )
}
