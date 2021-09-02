import React, {Fragment} from 'react'
import {Box, Flex, Text} from '@sanity/ui'
import {ChangeTitlePath, FieldChangeNode} from '../../types'
import {ChangeTitleSegment} from './ChangeTitleSegment'

export function ChangeBreadcrumb({
  change,
  titlePath,
}: {
  change?: FieldChangeNode
  titlePath: ChangeTitlePath
}): React.ReactElement {
  return (
    <Flex align="center">
      {titlePath.map((titleSegment, idx) => {
        const showSegment = typeof titleSegment === 'string' || !change || change.showIndex

        if (!showSegment) {
          return null
        }

        return (
          <Fragment key={idx}>
            {idx > 0 && (
              <Box as="span" paddingX={1}>
                <Text as="span" size={1} muted>
                  /
                </Text>
              </Box>
            )}
            <ChangeTitleSegment change={change} segment={titleSegment} />
          </Fragment>
        )
      })}
    </Flex>
  )
}
