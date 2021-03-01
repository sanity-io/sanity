import React from 'react'
import config from 'config:sanity'
import FullscreenMessageDialog from 'part:@sanity/components/dialogs/fullscreen-message'

export default function MissingProjectConfig() {
  const {root, project, plugins} = config
  const {dataset, projectId} = config.api || {}
  const api = {projectId: projectId || 'myProjectId', dataset: dataset || 'myDatasetName'}
  const desiredConfig = {root, project, api, plugins}
  const missing = [!projectId && '"projectId"', !dataset && '"dataset"'].filter(Boolean)
  return (
    <FullscreenMessageDialog title="Project details missing">
      <p>
        The <code>sanity.json</code> file in your studio folder seems to be missing the{' '}
        {missing.join(' and ')} configuration {missing.length > 1 ? 'options ' : 'option '}
        under the <code>api</code> key.
      </p>
      <p>
        A valid <code>sanity.json</code> file looks something like the following:
      </p>
      <pre>
        <code>{highlightMissing(JSON.stringify(desiredConfig, null, 2))}</code>
      </pre>
    </FullscreenMessageDialog>
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
