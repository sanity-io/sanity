import {UnknownIcon} from '@sanity/icons'
import React, {forwardRef, useMemo, useState} from 'react'
import {startCase} from 'lodash'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
import {useRovingFocus} from '../../../../components'
import {useColorScheme} from '../../../colorScheme'
import {Tool} from '../../../../config'
import {ToolLink, ToolLinkProps} from './ToolLink'

interface ToolCollapseMenuProps {
  activeToolName?: string
  tools: Tool[]
}

export function ToolCollapseMenu(props: ToolCollapseMenuProps) {
  const {activeToolName, tools} = props
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
    [scheme],
  )

  const children = useMemo(
    () =>
      tools.map((tool, index) => {
        const title = tool?.title || startCase(tool.name) || undefined

        const Link = forwardRef(function Link(
          linkProps: ToolLinkProps,
          ref: React.Ref<HTMLAnchorElement>,
        ) {
          return <ToolLink {...linkProps} ref={ref} name={tool.name} />
        })

        return (
          <CollapseMenuButton
            as={Link}
            data-as="a"
            collapsedProps={{tooltipText: tool.title}}
            icon={tool.icon || UnknownIcon}
            // eslint-disable-next-line react/no-array-index-key
            key={`${tool.name}-${index}`}
            mode="bleed"
            selected={activeToolName === tool.name}
            text={title}
            tooltipProps={{scheme: scheme}}
          />
        )
      }),
    [activeToolName, scheme, tools],
  )

  return (
    <CollapseMenu
      data-testid="tool-collapse-menu"
      gap={1}
      menuButtonProps={menuButtonProps}
      ref={setCollapseMenuEl}
    >
      {children}
    </CollapseMenu>
  )
}
