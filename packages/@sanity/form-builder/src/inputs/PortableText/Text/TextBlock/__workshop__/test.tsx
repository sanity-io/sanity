/* eslint-disable react/style-prop-object */
import {Card, Container, Flex} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React from 'react'
import {TextBlock} from '../TextBlock'

export default function TestStory() {
  const hasErrors = useBoolean('Has errors', false)

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={1}>
        <Card padding={3} shadow={1} overflow="auto">
          <TextBlock hasError={hasErrors} style="h1">
            Heading 1
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal" listItem="number" level={1}>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal" listItem="number" level={2}>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal" listItem="number" level={3}>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal" listItem="number" level={3}>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="h2">
            Heading 2
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal" listItem="bullet" level={1}>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal" listItem="bullet" level={2}>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="h3">
            Heading 3
          </TextBlock>

          <TextBlock hasError={hasErrors} style="normal">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>

          <TextBlock hasError={hasErrors} style="blockquote">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>
        </Card>
      </Container>
    </Flex>
  )
}
