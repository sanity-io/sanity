import {Box, Card, Flex, Popover, Text, useClickOutside} from '@sanity/ui'
import React from 'react'
import {BulbOutlineIcon, UnknownIcon} from '@sanity/icons'
import {resolveTypeName} from '../../../../utils/resolveTypeName'

type Props = {value: any; onFocus?: () => void}
export function ItemWithMissingType(props: Props) {
  const {value, onFocus} = props
  const [showDetails, setShowDetails] = React.useState(false)
  const [popoverRef, setPopoverRef] = React.useState<HTMLElement | null>(null)

  useClickOutside(() => setShowDetails(false), [popoverRef])

  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      setShowDetails(false)
    }
  }, [])

  const typeName = resolveTypeName(value)
  return (
    <Popover
      open={showDetails}
      ref={setPopoverRef}
      onKeyDown={handleKeyDown}
      content={
        <Card
          margin={1}
          padding={1}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{outline: 'none'}}
        >
          <Box>
            <b>Why is this happening?</b>
          </Box>
          The current schema does not declare items of type <code>{typeName}</code> as valid for
          this list. This could mean that the type has been removed as a valid item type, or that
          someone else has added it to their own local schema that is not yet deployed.
          <Box marginTop={4}>
            <Text>
              <BulbOutlineIcon /> You can still move or delete this item, but it cannot be edited
              since the schema definition for its type is nowhere to be found.
            </Text>
          </Box>
          <Box marginTop={4}>JSON representation of this item:</Box>
          <Card overflow="auto" border>
            <Text size={1}>
              <pre>{JSON.stringify(value, null, 2)}</pre>
            </Text>
          </Card>
        </Card>
      }
    >
      <Card
        as="button"
        radius={2}
        padding={2}
        onFocus={onFocus}
        onClick={() => setShowDetails(true)}
        onKeyDown={handleKeyDown}
      >
        <Flex>
          <Text size={1}>
            <UnknownIcon />
          </Text>
          <Box marginLeft={2} flex={1}>
            <Text size={1}>
              Item type <code>{typeName}</code> not defined for this list
            </Text>
          </Box>
        </Flex>
      </Card>
    </Popover>
  )
}
