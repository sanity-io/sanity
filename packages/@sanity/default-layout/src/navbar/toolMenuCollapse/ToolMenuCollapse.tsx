import {PlugIcon} from '@sanity/icons'
import {StateLink} from '@sanity/state-router/components'
import React, {forwardRef, useMemo} from 'react'
import {Tool, Router} from '../../types'
import {CollapseMenu, CollapseMenuButton} from '../components'

export function ToolMenuCollapse({tools, router}: {tools: Tool[]; router: Router}) {
  const tool = router.state?.tool || ''

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line no-shadow
      forwardRef(function LinkComponent(
        props: {children: React.ReactNode; tool: Tool},
        ref: React.ForwardedRef<HTMLAnchorElement>
      ) {
        const {name} = props.tool as Tool
        const linkProps = {...props, router: null, tool: null, title: null}

        return (
          <StateLink
            {...linkProps}
            state={{...router.state, tool: name, [name]: undefined}}
            ref={ref}
          />
        )
      }),
    [router.state]
  )

  const toolsOptions = useMemo(
    () =>
      tools.map((t) => {
        return {
          ...t,
          icon: t?.icon || PlugIcon,
          text: t.title || t.name,
          tool: t,
          selected: tool === t.name,
        }
      }),
    [tool, tools]
  )

  return (
    <CollapseMenu menuScheme="light">
      {toolsOptions.map((t) => (
        <CollapseMenuButton
          key={t?.name}
          as={LinkComponent}
          data-as="a"
          mode="bleed"
          tooltipScheme="light"
          tool={t}
          {...t}
        />
      ))}
    </CollapseMenu>
  )
}
