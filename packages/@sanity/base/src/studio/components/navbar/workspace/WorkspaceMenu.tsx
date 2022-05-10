import {SelectIcon} from '@sanity/icons'
import {Box, Button, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {Source} from '../../../../config'
import {useColorScheme} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {WorkspacePreview} from './WorkspacePreview'

export function WorkspaceMenu() {
  const {unstable_sources: sources, title, name, dataset} = useWorkspace()
  const {scheme} = useColorScheme()

  const button = useMemo(
    () => (
      <Button mode="bleed" padding={1}>
        <Flex align="center">
          <WorkspacePreview subtitle={dataset} title={title} />

          <Box paddingX={1}>
            <Text size={1} textOverflow="ellipsis">
              <SelectIcon />
            </Text>
          </Box>
        </Flex>
      </Button>
    ),
    [dataset, title]
  )

  const popoverProps = useMemo(() => ({constrainSize: true, scheme, portal: true}), [scheme])

  // @todo: Add logic to change space
  const handleChangeSpace = useCallback((source: Source) => {
    return null
  }, [])

  return (
    <MenuButton
      id="workspace-menu"
      button={button}
      menu={
        <Menu>
          {sources.map((source) => (
            <MenuItem
              key={source.name}
              padding={1}
              pressed={source.name === name}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => handleChangeSpace(source)}
            >
              <WorkspacePreview
                color="magenta"
                key={source.name}
                selected={source.name === name}
                subtitle={source.dataset}
                title={source.title}
              />
            </MenuItem>
          ))}
        </Menu>
      }
      popover={popoverProps}
    />
  )
}
