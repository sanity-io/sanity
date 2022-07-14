import React from 'react'
import {Flex, Card, Inline, Text, Heading} from '@sanity/ui'
import styled from 'styled-components'

// helps with the pretty formatting in the preview tab so that the content is consistent across the different documents
export function PreviewWrapper({children}) {
  return (
    <Background paddingX={3} paddingY={5} justify="center">
      <Canvas radius={6}>
        <Flex as="header" direction="row" align="center" padding={4} justify="space-between">
          <Title size={1}>Pets*Project</Title>
          <nav>
            <Inline space={3}>
              <Text>Blog</Text>
              <Text>Store</Text>
            </Inline>
          </nav>
        </Flex>

        <main>{children}</main>

        <Flex
          as="footer"
          direction="column"
          align="center"
          padding={4}
          paddingTop={6}
          marginBottom={4}
        >
          <img src="/static/madeWithSanity.svg" alt="my logo" />
        </Flex>
      </Canvas>
    </Background>
  )
}

const Background = styled(Flex)`
  background: #1c2430;
`

const Canvas = styled(Card)`
  background: #fff0eb;
  width: 390px;
  max-width: 100%;
`

const Title = styled(Heading)`
  font-style: italic;
  font-weight: 900;
`
