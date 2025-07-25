import {Stack} from '@sanity/ui'
import {startCase} from 'lodash'
import {forwardRef, type Ref, useMemo} from 'react'

import {Button} from '../../../../../ui-components'
import {type Tool} from '../../../../config'
import {ToolLink, type ToolLinkProps} from './ToolLink'

interface ToolVerticalMenuProps {
  activeToolName?: string
  isVisible: boolean
  tools: Tool[]
}

export function ToolVerticalMenu(props: ToolVerticalMenuProps) {
  const {activeToolName, isVisible, tools} = props

  return useMemo(
    () => (
      <Stack as="ul" space={1}>
        {tools.map((tool) => {
          const title = tool?.title || startCase(tool.name)

          const Link = forwardRef(function Link(
            linkProps: ToolLinkProps,
            ref: Ref<HTMLAnchorElement>,
          ) {
            return (
              <ToolLink {...linkProps} ref={ref} name={tool.name}>
                {linkProps.children}
              </ToolLink>
            )
          })

          return (
            <Stack key={tool.name} as="li">
              <Button
                as={Link}
                justify="flex-start"
                mode="bleed"
                selected={activeToolName === tool.name}
                size="large"
                tabIndex={isVisible ? 0 : -1}
                text={title}
              />
            </Stack>
          )
        })}
      </Stack>
    ),
    [activeToolName, isVisible, tools],
  )
}
