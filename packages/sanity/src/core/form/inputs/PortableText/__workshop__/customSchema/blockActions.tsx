import React, {memo, useCallback} from 'react'
import {CopyIcon} from '@sanity/icons'
import {keyGenerator} from '@sanity/portable-text-editor'
import {PortableTextBlock, PortableTextTextBlock} from '@sanity/types'
import {RenderBlockActionsCallback} from '../../../../types/_transitional'
import {Button} from '../../../../../../ui'

const BlockActions = memo(function BlockActions(props: {
  block: PortableTextBlock
  insert: (block: PortableTextBlock) => void
}) {
  const {block, insert} = props

  const handleDuplicate = useCallback(() => {
    const dupBlock: PortableTextTextBlock = {
      ...block,
      _type: 'block',
      _key: keyGenerator(),
      children: (Array.isArray(block.children) && block.children) || [],
      markDefs: (Array.isArray(block.markDefs) && block.markDefs) || [],
    }

    if (dupBlock.children) {
      dupBlock.children = dupBlock.children.map((c) => ({...c, _key: keyGenerator()}))
    }

    insert(dupBlock)
  }, [block, insert])

  return (
    <Button
      aria-label="Duplicate"
      icon={CopyIcon}
      onClick={handleDuplicate}
      size="small"
      tooltipProps={{content: 'Duplicate', placement: 'right', portal: 'default'}}
      mode="bleed"
    />
  )
})

export const renderBlockActions: RenderBlockActionsCallback = ({block, insert}) => {
  return <BlockActions block={block} insert={insert} />
}
