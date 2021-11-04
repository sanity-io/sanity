import {Button} from '@sanity/ui'
import React from 'react'
import {AddIcon} from '@sanity/icons'
import {keyGenerator} from '@sanity/portable-text-editor'

export function renderBlockActions({block, insert}) {
  const dupBlock = {
    ...block,
    _key: keyGenerator(),
  }

  if (dupBlock.children) {
    dupBlock.children = dupBlock.children.map((c) => ({...c, _key: keyGenerator()}))
  }

  const handleClick = () => insert(dupBlock)

  return (
    <div>
      <Button fontSize={1} icon={AddIcon} onClick={handleClick} padding={2} mode="bleed" />
    </div>
  )
}
