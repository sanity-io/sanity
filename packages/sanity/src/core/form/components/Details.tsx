import {ToggleArrowRightIcon} from '@sanity/icons'
import {Box, Flex, Inline, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import styled from 'styled-components'

interface DetailsProps {
  children?: React.ReactNode
  margin?: number | number[]
  marginX?: number | number[]
  marginY?: number | number[]
  marginTop?: number | number[]
  marginRight?: number | number[]
  marginBottom?: number | number[]
  marginLeft?: number | number[]
  open?: boolean
  icon?: React.ReactNode
  title?: React.ReactNode
}

const HeaderButton = styled.button`
  display: block;
  -webkit-font-smoothing: inherit;
  appearance: none;
  font: inherit;
  background: none;
  width: 100%;
  text-align: left;
  border: 0;
  margin: 0;
  padding: 0;
  outline: none;
`

const ToggleArrow = styled(ToggleArrowRightIcon)<{open: boolean}>`
  transform: ${(props) => (props.open ? 'rotate(90deg)' : '')};
`

const Header = styled(Flex)`
  cursor: default;
`

const IconBox = styled(Box)`
  & > div > svg {
    transform: rotate(0);
    transition: transform 100ms;
  }

  &[data-open] > div > svg {
    transform: rotate(90deg);
  }
`

export function Details(props: DetailsProps) {
  const {children, open: openProp, icon, title = 'Details', ...restProps} = props
  const [open, setOpen] = useState(openProp || false)

  const handleToggle = useCallback(() => setOpen((v) => !v), [])

  useEffect(() => setOpen(openProp || false), [openProp])

  return (
    <Box {...restProps}>
      <HeaderButton type="button" onClick={handleToggle}>
        <Header align="center">
          <Inline>
            <IconBox data-open={open ? '' : undefined}>
              <Text size={1}>
                <ToggleArrow open={open} />
              </Text>
            </IconBox>
            {icon && <Box marginLeft={1}>{icon}</Box>}
            <Box flex={1} marginLeft={1}>
              <Text size={1} weight="medium">
                {title}
              </Text>
            </Box>
          </Inline>
        </Header>
      </HeaderButton>

      <Box hidden={!open} marginTop={3}>
        {children}
      </Box>
    </Box>
  )
}
