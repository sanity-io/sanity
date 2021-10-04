import React from 'react'
import config from 'config:sanity'
import {Dialog, Stack, Code, Text, Card} from '@sanity/ui'

export default function MissingProjectConfig() {
  const {root, project, plugins} = config
  const {dataset, projectId} = config.api || {}
  const api = {projectId: projectId || 'myProjectId', dataset: dataset || 'myDatasetName'}
  const desiredConfig = {root, project, api, plugins}
  const missing = [!projectId && '"projectId"', !dataset && '"dataset"'].filter(Boolean)
  return (
    <Dialog id="missing-project-config" header="Project details missing" padding={2} width={1}>
      <Stack space={4} padding={4}>
        <Text as="p">
          The <code>sanity.json</code> file in your studio folder seems to be missing the{' '}
          {missing.join(' and ')} configuration {missing.length > 1 ? 'options ' : 'option '}
          under the <code>api</code> key.
        </Text>
        <Text as="p">
          A valid <code>sanity.json</code> file looks something like the following:
        </Text>
        <Card tone="transparent" padding={4} radius={2}>
          <Code>{highlightMissing(JSON.stringify(desiredConfig, null, 2))}</Code>
        </Card>
      </Stack>
    </Dialog>
  )
}

// eslint-disable-next-line react/no-multi-comp
function highlightMissing(jsonConfig) {
  const parts = jsonConfig
    .split(/("dataset": "myDatasetName"|"projectId": "myProjectId")/)
    .reduce((els, part, i) => {
      if (i % 2 === 0) {
        return els.concat(part)
      }

      return els.concat(<strong key={part}>{part}</strong>)
    }, [])

  return <>{parts}</>
}
