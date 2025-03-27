import {ToggleArrowRightIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {type ResponsiveProp} from '@sanity/ui/css'
import {type Space} from '@sanity/ui/theme'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {styled} from 'styled-components'

interface DetailsProps {
  children?: ReactNode
  margin?: ResponsiveProp<Space>
  marginX?: ResponsiveProp<Space>
  marginY?: ResponsiveProp<Space>
  marginTop?: ResponsiveProp<Space>
  marginRight?: ResponsiveProp<Space>
  marginBottom?: ResponsiveProp<Space>
  marginLeft?: ResponsiveProp<Space>
  open?: boolean
  icon?: ReactNode
  title?: ReactNode
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
  line-height: 0;
`

const IconBox = styled(Flex)`
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
        <Header>
          <Flex align="center">
            <IconBox data-open={open ? '' : undefined}>
              <Text size={1}>
                <ToggleArrow open={open} />
              </Text>
            </IconBox>
            {icon && <Box marginLeft={1}>{icon}</Box>}
            <Box flex={1} marginLeft={1}>
              <Text textOverflow="ellipsis" size={1} weight="medium">
                {title}
              </Text>
            </Box>
          </Flex>
        </Header>
      </HeaderButton>

      <Box hidden={!open} marginTop={3}>
        {children}
      </Box>
    </Box>
  )
}
