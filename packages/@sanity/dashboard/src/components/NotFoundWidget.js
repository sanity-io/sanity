import PropTypes from 'prop-types'
import React from 'react'
import {Card, Stack, Heading, Box} from '@sanity/ui'
import styled from 'styled-components'

const Root = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  height: 100%;
`

function NotFoundWidget(props) {
  const {title, children} = props
  return (
    <Root radius={3} paddingX={3} paddingY={4} tone="critical">
      <Stack space={2}>
        {title && (
          <Heading size={1} as="h2">
            {title}
          </Heading>
        )}
        {children && <Box>{children}</Box>}
      </Stack>
    </Root>
  )
}

NotFoundWidget.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  title: PropTypes.any,
}

NotFoundWidget.defaultProps = {
  children: null,
  title: null,
}

export default NotFoundWidget
