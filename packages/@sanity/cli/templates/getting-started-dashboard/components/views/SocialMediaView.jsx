import React from 'react'
import {Card, Flex, Box, Label, Stack, Heading, Text} from '@sanity/ui'
import PropTypes from 'prop-types'
import {urlFor} from '../../helpers/image-url-builder'
import styled from 'styled-components'

/**
 * Displays the currently displayed document as Social Media cards
 * Used in the Settings in the Document List on the desk tool
 */
export function SocialMediaView(props) {
  const doc = props.document.displayed
  if (!doc) {
    return null
  }

  return (
    <Flex padding={5}>
      <Box marginX={'auto'}>
        <Flex direction="column" justify="center" align="left" gap={5}>
          <Stack space={3}>
            <Label size={2} as="h2">
              Twitter - Mobile
            </Label>
            <Card border radius={2} style={{width: 224}}>
              {doc.ogimage?.asset ? (
                <Card style={{width: 224}}>
                  <img
                    style={{width: 224, height: 224}}
                    src={urlFor(doc.ogimage).width(448).height(448).url()}
                    alt="OG Image preview"
                  />
                  <Box padding={3}>
                    <Stack space={2}>
                      <Text size={1} muted>
                        Sanity.io
                      </Text>
                      <Text size={2} weight="medium">
                        {doc.title ?? 'Title not specified'}
                      </Text>
                    </Stack>
                  </Box>
                </Card>
              ) : (
                <Card padding={3}>
                  <Text>OG image not specified.</Text>
                </Card>
              )}
            </Card>
          </Stack>
          <Stack space={3}>
            <Label size={2} as="h2">
              Twitter - Desktop
            </Label>
            <Card border radius={2}>
              {doc.ogimage?.asset ? (
                <Card style={{width: 584}}>
                  <img
                    style={{width: 584, height: 220}}
                    src={urlFor(doc.ogimage).width(1168).height(440).url()}
                    alt="OG Image preview"
                  />
                  <Box padding={4}>
                    <Stack space={3}>
                      <Heading size={1}>{doc.title ?? 'Title not specified'}</Heading>
                      <TextWithEllipsis size={1}>
                        {doc.description ?? 'Description not specified'}
                      </TextWithEllipsis>
                      <Text size={1} muted>
                        Sanity.io
                      </Text>
                    </Stack>
                  </Box>
                </Card>
              ) : (
                <Card padding={3}>
                  <Text>OG image not specified.</Text>
                </Card>
              )}
            </Card>
          </Stack>
          <Stack space={3}>
            <Label size={2} as="h2">
              Facebook
            </Label>
            <Card border radius={2}>
              {doc.ogimage?.asset ? (
                <Card style={{width: 584}}>
                  <img
                    style={{width: 584, height: 274}}
                    src={urlFor(doc.ogimage).width(1168).height(548).url()}
                    alt="OG Image preview"
                  />
                  <Box padding={4}>
                    <Stack space={3}>
                      <Label>Sanity.io</Label>
                      <Heading size={1}>{doc.title ?? 'Title not specified'}</Heading>
                      <TextWithEllipsis size={1}>
                        {doc.description ?? 'Description not specified'}
                      </TextWithEllipsis>
                    </Stack>
                  </Box>
                </Card>
              ) : (
                <Card padding={3}>
                  <Text>OG image not specified.</Text>
                </Card>
              )}
            </Card>
          </Stack>
        </Flex>
      </Box>
    </Flex>
  )
}

SocialMediaView.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
}

const TextWithEllipsis = styled(Text)`
  width: 100%;
  * {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
