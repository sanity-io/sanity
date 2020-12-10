import {AddIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import {Button, Card, Code, Heading, Inline, Text} from '@sanity/ui'

const example = `<Inline space={[3, 3, 4, 5]} style={{textAlign: 'center'}}>
  <Button
    fontSize={[2, 2, 3, 4]}
    icon={AddIcon}
    padding={[3, 3, 4]}
    text="Create"
  />
  <Button
    fontSize={[2, 2, 3, 4]}
    icon={PublishIcon}
    padding={[3, 3, 4]}
    text="Publish"
    tone="primary"
  />
</Inline>`

export default function MyTool() {
  return (
    <Card padding={2} style={{height: '100%'}}>
      <Card padding={2}>
        <Text>This is a blank slate for you to build on.</Text>
      </Card>
      <Card tone="positive" border={1} padding={2}>
        <Text>Here's a positive card</Text>
      </Card>
      <Card padding={2}>
        <Heading as="h2">Here's a code example</Heading>
      </Card>
      <Card padding={2}>
        <Code language="jsx">{example}</Code>
      </Card>
      <Card padding={2}>
        <Heading as="h2">Here's the above code in action</Heading>
      </Card>
      <Inline space={[3, 3, 4, 5]}>
        <Button fontSize={[2, 2, 3, 4]} icon={AddIcon} padding={[3, 3, 4]} text="Create" />
        <Button
          fontSize={[2, 2, 3, 4]}
          icon={PublishIcon}
          padding={[3, 3, 4]}
          text="Publish"
          tone="primary"
        />
      </Inline>
    </Card>
  )
}
