export const typingPerfRun = {
  name: 'typingPerfRun',
  type: 'document',
  liveEdit: true,
  readOnly: true,
  fields: [
    {type: 'number', name: 'result'},
    {type: 'boolean', name: 'ci', title: 'CI', description: 'Was this sample from on a CI server?'},
    {
      name: 'github',
      type: 'object',
      title: 'Github info',
      description: 'Additional details about the GitHub workflow/action triggering this test run',
      fields: [
        {
          name: 'workflow',
          type: 'string',
        },
        {
          name: 'action',
          type: 'string',
        },
        {
          name: 'runId',
          type: 'string',
        },
      ],
    },
    {type: 'string', name: 'baseVersion'},
    {name: 'instance', type: 'instance'},
    {
      type: 'object',
      name: 'git',
      fields: [
        {
          name: 'branch',
          type: 'string',
        },
        {
          name: 'tag',
          type: 'string',
        },
        {
          name: 'sha',
          type: 'string',
        },
      ],
    },
  ],
  preview: {
    select: {
      result: 'result',
      ci: 'ci',
      baseVersion: 'baseVersion',
      sha: 'git.sha',
    },
    prepare(values) {
      return {
        title: `${values.result}ms @ v${values.baseVersion || '<unknown>'}${
          values.ci ? ` (CI)` : ''
        }`,
        subtitle: values.sha,
      }
    },
  },
}

export const typingPerfSummary = {
  type: 'document',
  name: 'typingSpeedSummary',
  fields: [
    {
      name: 'hardwareProfile',
      type: 'reference',
      to: [{type: 'hardwareProfile'}],
    },
    {
      name: 'runs',
      type: 'array',
      of: [{type: 'reference', to: {type: 'typingPerfRun'}}],
    },
  ],
}
export const summary = {
  type: 'document',
  name: 'summary',
  fields: [
    {
      name: 'hardwareProfile',
      type: 'reference',
      to: [{type: 'hardwareProfile'}],
    },
  ],
}
