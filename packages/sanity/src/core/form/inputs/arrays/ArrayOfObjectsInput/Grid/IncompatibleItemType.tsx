import {Box, Card, Code, Popover, Stack, Text, Theme, useClickOutside} from '@sanity/ui'
import React, {useCallback} from 'react'
import {BulbOutlineIcon, UnknownIcon} from '@sanity/icons'
import {resolveTypeName} from '@sanity/util/content'
import styled from 'styled-components'

const PopoverCard = styled(Card)`
  max-width: ${({theme}: {theme: Theme}) => theme.sanity.container[1]}px;
`

interface Props {
  value: unknown
  onFocus?: (event: React.FocusEvent) => void
  vertical?: boolean
}

export function IncompatibleItemType(props: Props) {
  const {value, onFocus, vertical, ...rest} = props
  const [showDetails, setShowDetails] = React.useState(false)
  const [popoverRef, setPopoverRef] = React.useState<HTMLElement | null>(null)

  useClickOutside(() => setShowDetails(false), [popoverRef])

  const handleKeyDown = React.useCallback((e: any) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      setShowDetails(false)
    }
  }, [])

  const handleShowDetails = useCallback(() => {
    setShowDetails((v) => !v)
  }, [])

  const typeName = resolveTypeName(value)
  return (
    <Popover
      open={showDetails}
      ref={setPopoverRef}
      onKeyDown={handleKeyDown}
      portal
      constrainSize
      tone="default"
      content={
        <PopoverCard margin={1} padding={3} onKeyDown={handleKeyDown} tabIndex={0} overflow="auto">
          <Stack space={4}>
            <Box>
              <Text weight="medium">Why is this happening?</Text>
            </Box>
            <Text size={1}>
              The current schema does not declare items of type <code>{typeName}</code> as valid for
              this list. This could mean that the type has been removed as a valid item type, or
              that someone else has added it to their own local schema that is not yet deployed.
            </Text>
            <Box>
              <Text size={1}>
                <BulbOutlineIcon /> You can still move or delete this item, but it cannot be edited
                since the schema definition for its type is nowhere to be found.
              </Text>
            </Box>
            <Stack space={2}>
              <Text size={1} weight="medium">
                JSON representation of this item:
              </Text>
              <Card padding={2} overflow="auto" border>
                <Code size={1} as="pre" language="json">
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Card>
            </Stack>
          </Stack>
        </PopoverCard>
      }
    >
      <Card
        as="button"
        type="button"
        radius={2}
        tone="inherit"
        paddingX={2}
        paddingY={3}
        style={{height: '100%'}}
        onFocus={onFocus}
        onClick={handleShowDetails}
        onKeyDown={handleKeyDown}
        __unstable_focusRing
        {...rest}
      >
        <Stack space={4} marginTop={2}>
          <Box margin={1}>
            <Text align="center" size={4}>
              <UnknownIcon />
            </Text>
          </Box>
          <Text align="center" size={1}>
            Items of type <code>{typeName}</code> is not valid for this list
          </Text>
        </Stack>
      </Card>
    </Popover>
  )
}
