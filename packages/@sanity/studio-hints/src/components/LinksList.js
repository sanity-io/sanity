import React from 'react'
import PropTypes from 'prop-types'
import {Card, Text, Stack, Flex, Box, Label} from '@sanity/ui'
import {LaunchIcon} from '@sanity/icons'
import HintCard from './HintCard'

function CardLinks(props) {
  const {type, links, title, repoId} = props
  if (!links) {
    return null
  }

  if (type === 'card') {
    return (
      <Stack space={4}>
        <Label muted>{title}</Label>
        <Stack space={2} as="ul">
          {links.map((link) => (
            <Box as="li" key={link._key}>
              <HintCard card={link} repoId={repoId} />
            </Box>
          ))}
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack space={4}>
      <Label muted as="h3">
        {title}
      </Label>
      <Card radius={2} border tone="inherit" overflow="hidden">
        <Stack as="ul">
          {links.map((link) => {
            return (
              <Box as="li" key={link._key}>
                <Card
                  tone="inherit"
                  padding={4}
                  as="a"
                  href={`${link.url}?utm_source=hints&utm_medium=${repoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Flex justify="space-between" align="center">
                    <Text muted>{link.title}</Text>
                    <Text muted>
                      <LaunchIcon />
                    </Text>
                  </Flex>
                </Card>
              </Box>
            )
          })}
        </Stack>
      </Card>
    </Stack>
  )
}

CardLinks.propTypes = {
  type: PropTypes.string,
  title: PropTypes.string,
  repoId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  links: PropTypes.array.isRequired,
}

CardLinks.defaultProps = {
  type: null,
  title: '',
}

export default CardLinks
