import React from 'react'
import PropTypes from 'prop-types'
import {Card, Text, Heading, Stack, Flex} from '@sanity/ui'
import {LaunchIcon} from '@sanity/icons'
import {resolveUrl} from './utils'

function HintCard(props) {
  const {card, repoId} = props

  return (
    <Card
      tone="inherit"
      border
      radius={2}
      padding={4}
      as="a"
      href={resolveUrl(card.hint, repoId)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Stack space={3}>
        <Flex justify="space-between">
          <Heading size={1} muted as="h4">
            {card.titleOverride || card.hint.title}
          </Heading>
          <Text muted>
            <LaunchIcon />
          </Text>
        </Flex>
        <Text size={1} muted>
          {card.hint.description}
        </Text>
      </Stack>
    </Card>
  )
}

HintCard.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  card: PropTypes.object.isRequired,
  repoId: PropTypes.string.isRequired,
  // onCardClick: PropTypes.func.isRequired
}

export default HintCard
