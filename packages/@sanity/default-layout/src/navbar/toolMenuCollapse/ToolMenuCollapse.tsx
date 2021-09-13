import {PlugIcon} from '@sanity/icons'
import {StateLink} from '@sanity/base/router'
import React, {useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton} from '@sanity/base/components'
import {Tool, Router} from '../../types'

export function ToolMenuCollapse({tools, router}: {tools: Tool[]; router: Router}) {
  const activeTool = router.state.tool || ''

  return useMemo(
    () => (
      <CollapseMenu menuPopoverProps={{scheme: 'light'}} gap={1}>
        {tools?.map((tool) => {
          const Link = (props: any) => (
            <StateLink
              {...props}
              state={{
                ...router.state,
                tool: tool?.name,
                [tool?.name]: undefined,
              }}
            />
          )

          return (
            <CollapseMenuButton
              // eslint-disable-next-line react/jsx-no-bind
              as={Link}
              key={tool?.name}
              data-as="a"
              buttonProps={{mode: 'bleed'}}
              tooltipProps={{scheme: 'light'}}
              text={tool.title}
              icon={tool?.icon || PlugIcon}
              selected={activeTool === tool?.name}
            />
          )
        })}
      </CollapseMenu>
    ),
    [activeTool, router.state, tools]
  )
}
