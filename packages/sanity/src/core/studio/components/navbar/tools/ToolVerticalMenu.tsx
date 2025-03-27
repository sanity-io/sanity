import {Stack} from '@sanity/ui'
import {startCase} from 'lodash'

import {Button} from '../../../../../ui-components'
import {type Tool} from '../../../../config'
import {ToolLink} from './ToolLink'

interface ToolVerticalMenuProps {
  activeToolName?: string
  isVisible: boolean
  tools: Tool[]
}

export function ToolVerticalMenu(props: ToolVerticalMenuProps) {
  const {activeToolName, isVisible, tools} = props

  return (
    <Stack as="ul" gap={1}>
      {tools.map((tool) => {
        const title = tool?.title || startCase(tool.name)

        return (
          <Stack key={tool.name} as="li">
            <Button
              as={ToolLink}
              justify="flex-start"
              mode="bleed"
              name={tool.name}
              selected={activeToolName === tool.name}
              size="large"
              tabIndex={isVisible ? 0 : -1}
              text={title}
            />
          </Stack>
        )
      })}
    </Stack>
  )
}
