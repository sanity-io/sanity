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
    <Flex align="center" paddingBottom={1}>
      {titlePath.map((titleSegment, idx) => {
        const showSegment = typeof titleSegment === 'string' || !change || change.showIndex
        if (!showSegment) {
          return null
        }

        return (
          <Fragment key={idx}>
            {idx > 0 && (
              <Box paddingX={1}>
                <Text size={1} muted as="em">
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
