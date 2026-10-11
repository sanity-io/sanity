import {Card, Text} from '@sanity/ui'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {Box, Container, Flex} from 'ui5'

interface Document {
  string?: string
  number?: number
}

export const PerspectiveExample = (props: {options: {doc$: Observable<Document>}}) => {
  const {options} = props
  const doc$ = options.doc$
  const doc = useObservable(doc$, null)

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
        <Box width="50%">
          <Text size={3} weight="bold">
            Title and Number
          </Text>
          <pre>title: {JSON.stringify(doc?.string, null, 2)}</pre>

          <pre>number: {JSON.stringify(doc?.number, null, 2)}</pre>
        </Box>
        <Box width="50%">
          <Text size={3} weight="bold">
            Full JSON
          </Text>
          <pre>{JSON.stringify(doc, null, 2)}</pre>
        </Box>
      </Flex>
    </Container>
  )
}
