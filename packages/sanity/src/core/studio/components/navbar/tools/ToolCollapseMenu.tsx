import React, {forwardRef, useMemo, useState} from 'react'
import {startCase} from 'lodash'
import {Flex} from '@sanity/ui'
import styled from 'styled-components'
import {CollapseTabList} from '../../../../components/collapseTabList/CollapseTabList'
import {useRovingFocus} from '../../../../components'
import {useColorScheme} from '../../../colorScheme'
import {Tool} from '../../../../config'
import {Button} from '../../../../ui-components'
import {ToolLink, ToolLinkProps} from './ToolLink'
import {getToolButtonWrapperElement} from './getToolButtonWrapperElement'

interface ToolCollapseMenuProps {
  activeToolName?: string
  tools: Tool[]
}

const CollapseTabListWrapper = styled(Flex)`
  margin: 0 80px;
`

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
        const title = tool?.title || startCase(tool.name)

        const Link = forwardRef(function Link(
          linkProps: ToolLinkProps,
          ref: React.Ref<HTMLAnchorElement>,
        ) {
          const Wrapper = getToolButtonWrapperElement(tool)

          return (
            <ToolLink {...linkProps} ref={ref} name={tool.name}>
              <Wrapper>{linkProps.children}</Wrapper>
            </ToolLink>
          )
        })

        return (
          <Button
            as={Link}
            data-as="a"
            // eslint-disable-next-line react/no-array-index-key
            key={`${tool.name}-${index}`}
            mode="bleed"
            selected={activeToolName === tool.name}
            text={title}
          />
        )
      }),
    [activeToolName, tools],
  )

  return (
    <CollapseTabListWrapper justify="center">
      <CollapseTabList
        data-testid="tool-collapse-menu"
        gap={1}
        menuButtonProps={menuButtonProps}
        ref={setCollapseMenuEl}
      >
        {children}
      </CollapseTabList>
    </CollapseTabListWrapper>
  )
}
