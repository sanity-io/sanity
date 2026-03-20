import {ToggleArrowRightIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useState} from 'react'

import {header, headerButton, iconBox} from './Details.css'

interface DetailsProps {
  children?: ReactNode
  margin?: number | number[]
  marginX?: number | number[]
  marginY?: number | number[]
  marginTop?: number | number[]
  marginRight?: number | number[]
  marginBottom?: number | number[]
  marginLeft?: number | number[]
  open?: boolean
  icon?: ReactNode
  title?: ReactNode
}

export function Details(props: DetailsProps) {
  const {children, open: openProp, icon, title = 'Details', ...restProps} = props
  const [open, setOpen] = useState(openProp || false)

  const handleToggle = useCallback(() => setOpen((v) => !v), [])

  useEffect(() => setOpen(openProp || false), [openProp])

  return (
    <Box {...restProps}>
      <button type="button" className={headerButton} onClick={handleToggle}>
        <Flex className={header}>
          <Flex align="center">
            <Flex className={iconBox} data-open={open ? '' : undefined}>
              <Text size={1}>
                <ToggleArrowRightIcon
                  style={{
                    transform: open ? 'rotate(90deg)' : undefined,
                  }}
                />
              </Text>
            </Flex>
            {icon && <Box marginLeft={1}>{icon}</Box>}
            <Box flex={1} marginLeft={1}>
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
