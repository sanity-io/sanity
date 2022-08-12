import React from 'react'
import {Box, Flex, Card, Stack, Heading, Text} from '@sanity/ui'
import styled, {createGlobalStyle} from 'styled-components'

export function GettingStartedDocs() {
  return (
    <Root radius={3} display="flex">
      <Card padding={5} radius={3}>
        <Flex direction={['column', 'column', 'column']}>
          <Stack space={4} flex={1} paddingRight={[0, 0, 0, 3]}>
            <Box marginBottom={3}>
              <Heading as="h2" size={[3, 3, 3, 5]}>
                Welcome to your Sanity Studio!
              </Heading>
            </Box>
            <Text as="p" size={3}>
              Here are a few helpful videos to get you started. <br />
              You can also read our{' '}
              <a
                href="https://www.sanity.io/docs/getting-started?ref=studio-dashboard"
                target="_blank"
                rel="noreferrer"
              >
                Getting started guide.
              </a>
            </Text>
            <Text as="p" size={3}>
              For a deeper dive, head over to our{' '}
              <a
                href="https://www.sanity.io/docs?ref=studio-dashboard"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </a>
              .
            </Text>
          </Stack>
        </Flex>
      </Card>
      <HideDocsLinksStyles />
    </Root>
  )
}

const Root = styled(Card)`
  display: flex;
  flex-direction: row;
  justify-content: stretch;
  height: 100%;
  box-sizing: border-box;
  position: relative;
`

// This hides the Getting started banner in the SanityTutorials widget, since this widget is a duplicate of that one
export const HideDocsLinksStyles = createGlobalStyle`
  :root & [data-name="sanity-tutorials-widget-docs-link"] {
    display: none;
  }
`
