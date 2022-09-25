import {Box, Flex, Text} from '@sanity/ui'
import React from 'react'
import {DiffTooltip, FromToArrow, useDiffAnnotationColor} from '../../../diff'
import {BooleanDiff, DiffComponent} from '../../../types'
import {Checkbox, Switch} from '../preview'

export const BooleanFieldDiff: DiffComponent<BooleanDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const {title, options} = schemaType
  const Preview = options?.layout === 'checkbox' ? Checkbox : Switch
  const userColor = useDiffAnnotationColor(diff, [])

  const showToValue = toValue !== undefined && toValue !== null

  return (
    <Flex align="center">
      <DiffTooltip diff={diff}>
        <Flex align="center">
          <Preview checked={fromValue} color={userColor} />

          {showToValue && (
            <>
              <Box marginX={2}>
                <FromToArrow />
              </Box>
              <Preview checked={toValue} color={userColor} />
            </>
          )}
        </Flex>
      </DiffTooltip>

      {showToValue && title && (
        <Box marginLeft={2}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
        </Box>
      )}
    </Flex>
  )
}
