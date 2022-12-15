import i18n from 'i18next'
import k from './../../../../i18n/keys'
import {DocumentIcon} from '@sanity/icons'
import {Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useBoolean, useString} from '@sanity/ui-workshop'
import React from 'react'
import styled from 'styled-components'
import {InlinePreview} from '../portableText/InlinePreview'

const PreviewWrapper = styled.span`
  display: inline-block;
  vertical-align: top;
  background-color: var(--card-bg-color);
  box-shadow: inset 0 0 0 1px var(--card-border-color);
  border-radius: 2.66px;
  padding: 2px;
  margin-top: 0.0625em;
  height: calc(1em - 1px);

  & > span {
    vertical-align: top;
    margin: 0;
  }
`

export default function InlinePreviewStory() {
  const title = useString('Title', 'Inline object', 'Props')
  const withImage = useBoolean('With image', true, 'Props')

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={1}>
          <Stack space={4}>
            <Card tone="primary">
              <Heading size={5}>
                {i18n.t(k.HELLO)}{' '}
                <PreviewWrapper>
                  <InlinePreview
                    // eslint-disable-next-line react/jsx-no-bind
                    media={() =>
                      withImage ? (
                        <img src="https://source.unsplash.com/60x60/?face" />
                      ) : (
                        <DocumentIcon />
                      )
                    }
                    title={title}
                  />
                </PreviewWrapper>{' '}
                {i18n.t(k.WORLD)}
              </Heading>
            </Card>

            <Card tone="primary">
              <Heading>
                {i18n.t(k.HELLO)}{' '}
                <PreviewWrapper>
                  <InlinePreview
                    // eslint-disable-next-line react/jsx-no-bind
                    media={() =>
                      withImage ? (
                        <img src="https://source.unsplash.com/60x60/?face" />
                      ) : (
                        <DocumentIcon />
                      )
                    }
                    title={title}
                  />
                </PreviewWrapper>{' '}
                {i18n.t(k.WORLD)}
              </Heading>
            </Card>

            <Card tone="primary">
              <Text>
                {i18n.t(k.HELLO)}{' '}
                <PreviewWrapper>
                  <InlinePreview
                    // eslint-disable-next-line react/jsx-no-bind
                    media={() =>
                      withImage ? (
                        <img src="https://source.unsplash.com/60x60/?face" />
                      ) : (
                        <DocumentIcon />
                      )
                    }
                    title={title}
                  />
                </PreviewWrapper>{' '}
                {i18n.t(k.WORLD)}
              </Text>
            </Card>
          </Stack>
        </Container>
      </Flex>
    </Card>
  )
}
