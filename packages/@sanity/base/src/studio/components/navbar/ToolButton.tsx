import {UnknownIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import React, {useMemo} from 'react'
import {Tool} from '../../../config'
import {useStateLink} from '../../../router'

export function ToolButton(props: {selected: boolean; tool: Tool}) {
  const {selected, tool} = props
  const state = useMemo(() => ({tool: tool.name}), [tool])
  const link = useStateLink({state})

  return (
    <Button
      as="a"
      href={link.href}
      icon={tool.icon || UnknownIcon}
      mode="bleed"
      onClick={link.handleClick}
      selected={selected}
      text={tool.title}
    />
  )
}
