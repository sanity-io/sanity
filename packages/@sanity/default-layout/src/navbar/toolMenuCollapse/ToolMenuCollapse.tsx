import {PlugIcon} from '@sanity/icons'
import {StateLink} from '@sanity/base/router'
import React, {forwardRef, useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton} from '@sanity/base/components'
import type {Tool} from '../../types'
import {useDefaultLayoutRouter} from '../../useDefaultLayoutRouter'

export function ToolMenuCollapse({tools}: {tools: Tool[]}) {
  const router = useDefaultLayoutRouter()

  return useMemo(
    () => (
      <CollapseMenu menuPopoverProps={{scheme: 'light'}} gap={1}>
        {tools.map((tool) => {
          const Link = forwardRef(function Link(props: any, ref: any) {
            return (
              <StateLink
                {...props}
                ref={ref}
                state={{
                  ...router.state,
                  tool: tool.name,
                  [tool.name]: undefined,
                }}
              />
            )
          })

          return (
            <CollapseMenuButton
              // eslint-disable-next-line react/jsx-no-bind
              as={Link}
              key={tool.name}
              data-as="a"
              buttonProps={{mode: 'bleed'}}
              tooltipProps={{scheme: 'light'}}
              text={tool.title}
              icon={tool.icon || PlugIcon}
              selected={router.state.tool === tool.name}
            />
          )
        })}
      </CollapseMenu>
    ),
    [router.state, tools]
  )
}
