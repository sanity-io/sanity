import {Card, Container, Flex, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'

interface Document {
  string?: string
  number?: number
}

export const PerspectiveExample = (props: {options: any}) => {
  const {options} = props
  const doc$ = options.doc$
  const [doc, setDoc] = useState<Document | null>(null)
  useEffect(() => {
    const subscription = doc$.subscribe((docs: Document) => setDoc(docs))
    return () => subscription.unsubscribe()
  }, [doc$])

  return (
    <Container padding={4}>
      <Text size={4} weight="bold">
        PerspectiveExample
      </Text>
      <Card paddingTop={2}>
        This will show what the document with the _id === validation has for a "title" (string) and
        "number" (number) based on the perspective stack from the structure file.
      </Card>
      <Flex marginTop={4}>
        <Container width={1 / 2}>
          <Text size={3} weight="bold">
            Title and Number
          </Text>
          <pre>title: {JSON.stringify(doc?.string, null, 2)}</pre>

          <pre>number: {JSON.stringify(doc?.number, null, 2)}</pre>
        </Container>
        <Container width={1 / 2}>
          <Text size={3} weight="bold">
            Full JSON
          </Text>
          <pre>{JSON.stringify(doc, null, 2)}</pre>
        </Container>
      </Flex>
    </Container>
  )
}
