import {ToggleArrowRightIcon} from '@sanity/icons/ToggleArrowRight'
import {Flex, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {Box, type MarginProps} from 'ui5'

import {header, headerButton, iconBox, toggleArrowOpen} from './Details.css'

interface DetailsProps extends MarginProps {
  children?: ReactNode
  open?: boolean
  icon?: ReactNode
  title?: ReactNode
}

export function Details(props: DetailsProps) {
  const {children, open: openProp, icon, title = 'Details', ...restProps} = props
  const [open, setOpen] = useState(openProp || false)

  const handleToggle = useCallback(() => setOpen((v) => !v), [])

  // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
  useEffect(() => setOpen(openProp || false), [openProp])

  return (
    <Box {...restProps}>
      <button className={headerButton} type="button" onClick={handleToggle}>
        <Flex className={header}>
          <Flex align="center">
            <Flex className={iconBox} data-open={open ? '' : undefined}>
              <Text size={1}>
                <ToggleArrowRightIcon className={open ? toggleArrowOpen : undefined} />
              </Text>
            </Flex>
            {icon && <Box marginLeft={1}>{icon}</Box>}
            <Box flexBasis="0%" flexGrow={1} marginLeft={1}>
              <Text textOverflow="ellipsis" size={1} weight="medium">
                {title}
              </Text>
            </Box>
          </Flex>
        </Flex>
      </button>

      <Box hidden={!open} marginTop={3}>
        {children}
      </Box>
    </Box>
  )
}
