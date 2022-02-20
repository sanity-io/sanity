import {PlugIcon} from '@sanity/icons'
import {StateLink} from '@sanity/base/router'
import React, {forwardRef, useMemo, useState} from 'react'
import {CollapseMenuButton, CollapseMenu, useRovingFocus} from '@sanity/base/components'
import {MenuButtonProps, TooltipProps} from '@sanity/ui'
import {Tool} from '../../types'
import {useDefaultLayoutRouter} from '../../useDefaultLayoutRouter'

const BUTTON_TOOLTIP_PROPS: TooltipProps = {scheme: 'light'}
const MENU_BUTTON_PROPS: Omit<MenuButtonProps, 'id' | 'button'> = {
  popover: {constrainSize: true, portal: true, scheme: 'light'},
}

export function ToolMenuCollapse({tools}: {tools: Tool[]}) {
  const router = useDefaultLayoutRouter()
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  useRovingFocus({
    rootElement: rootElement,
  })

  return useMemo(
    () => (
      <CollapseMenu menuButtonProps={MENU_BUTTON_PROPS} gap={1} ref={setRootElement}>
        {tools.map((tool) => {
          const title = tool.title || tool.name

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
              mode="bleed"
              tooltipProps={BUTTON_TOOLTIP_PROPS}
              collapsedProps={{tooltipText: title}}
              text={title}
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
