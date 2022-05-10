import {UnknownIcon} from '@sanity/icons'
import React, {forwardRef, useMemo, useState} from 'react'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
import {useRovingFocus} from '../../../../components/rovingFocus'
import {StateLink, useRouterState} from '../../../../router'
import {useColorScheme} from '../../../colorScheme'
import {Tool} from '../../../../config'

interface ToolCollapseMenuProps {
  activeToolName?: string
  tools: Tool[]
}

export function ToolCollapseMenu(props: ToolCollapseMenuProps) {
  const {activeToolName, tools} = props
  const routerState = useRouterState()
  const {scheme} = useColorScheme()

  const [collapseMenuEl, setCollapseMenuEl] = useState<HTMLDivElement | null>(null)

  useRovingFocus({
    rootElement: collapseMenuEl,
    navigation: ['arrows'],
  })

  const menuButtonProps = useMemo(
    () => ({
      popover: {
        constrainSize: true,
        portal: true,
        scheme: scheme,
      },
    }),
    [scheme]
  )

  const children = useMemo(
    () =>
      tools.map((tool, index) => {
        const Link = forwardRef(function Link(
          linkProps: unknown,
          ref: React.Ref<HTMLAnchorElement>
        ) {
          return (
            <StateLink
              {...linkProps}
              ref={ref}
              state={{
                ...routerState,
                tool: tool.name,
                [tool.name]: undefined,
              }}
            />
          )
        })

        return (
          <CollapseMenuButton
            as={Link}
            collapsedProps={{tooltipText: tool.title}}
            data-as="a"
            icon={tool.icon || UnknownIcon}
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            mode="bleed"
            selected={activeToolName === tool.name}
            text={tool.title}
            tooltipProps={{scheme: scheme}}
          />
        )
      }),
    [activeToolName, routerState, scheme, tools]
  )

  return (
    <CollapseMenu gap={1} menuButtonProps={menuButtonProps} ref={setCollapseMenuEl}>
      {children}
    </CollapseMenu>
  )
}
