import {SourceProvider, useProject, useProjectDatasets, useSanity, useSource} from '@sanity/base'
import {Card, Code, Container, Select, Stack, Text} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

export function DataTool() {
  const {sources} = useSanity()
  const defaultSource = useSource()
  const [sourceName, setSourceName] = useState(defaultSource.name)

  const handleSourceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSourceName = event.currentTarget.value

    setSourceName(nextSourceName)
  }, [])

  return (
    <Card paddingX={4} paddingY={[4, 5, 6, 7]} sizing="border" style={{minHeight: '100%'}}>
      <Container width={1}>
        <Stack space={4}>
          <Text>This is for testing source/schema providers</Text>

          <Text>
            The default source in this Studio is <strong>{defaultSource.title}</strong>
          </Text>

          <Card padding={3} radius={2} shadow={1}>
            <Stack space={3}>
              <Select onChange={handleSourceChange} value={sourceName}>
                {sources.map((source) => (
                  <option key={source.name} value={source.name}>
                    {source.title}
                  </option>
                ))}
              </Select>

              <SourceProvider name={sourceName}>
                <SourceExample />
              </SourceProvider>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Card>
  )
}

function SourceExample() {
  const source = useSource()
  const project = useProject()
  const datasets = useProjectDatasets()

  const dataset = datasets.value?.find((d) => d.name === source.dataset) || null

  return (
    <Card padding={4} radius={3} sizing="border" tone="primary">
      <Stack space={4}>
        <Text>
          Source: <strong>{source.title}</strong>
        </Text>

        <Text>
          Project ID: <code>{source.projectId}</code>
        </Text>

        <Card overflow="auto" padding={3} radius={2} style={{height: 200}}>
          <Code language="json" size={1}>
            {JSON.stringify(project.value, null, 2)}
          </Code>
        </Card>

        <Text>
          Dataset: <code>{source.dataset}</code>
        </Text>

        <Card overflow="auto" padding={3} radius={2} style={{height: 200}}>
          <Code language="json" size={1}>
            {JSON.stringify(dataset, null, 2)}
          </Code>
        </Card>

        <Text>
          Schema: <code>{source.schema.name}</code>
        </Text>

        <Card overflow="auto" padding={3} radius={2} style={{height: 200}}>
          <Code language="json" size={1}>
            {JSON.stringify(
              {
                name: source.schema.name,
                typeNames: source.schema.getTypeNames(),
              },
              null,
              2
            )}
          </Code>
        </Card>
      </Stack>
    </Card>
  )
}
