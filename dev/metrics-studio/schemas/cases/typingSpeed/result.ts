import {ClockIcon, ActivityIcon} from '@sanity/icons'

export const typingPerfRun = {
  name: 'typingPerfRun',
  type: 'document',
  title: 'Typing perf run',
  liveEdit: true,
  readOnly: true,
  icon: ClockIcon,
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
      hostname: 'instance.hostname',
    },
    prepare({result, ci, hostname, baseVersion}) {
      return {
        title: `${result}ms @ ${hostname} ${ci ? ` (CI)` : ''}`,
        subtitle: `Base version: v${baseVersion || '<unknown>'}`,
      }
    },
  },
}

export const typingSpeedSummary = {
  type: 'document',
  icon: ActivityIcon,
  name: 'typingSpeedSummary',
  title: 'Typing perf summary',
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
  preview: {
    select: {
      hardwareProfileCpu: 'hardwareProfile.cpus.0',
      run0: 'runs.0.result',
      run1: 'runs.1.result',
      run2: 'runs.2.result',
      run3: 'runs.3.result',
      run4: 'runs.4.result',
      run5: 'runs.5.result',
    },
    prepare({hardwareProfileCpu, run0, run1, run2, run3, run4, run5}) {
      const runs = [run0, run1, run2, run3, run4, run5].filter(Boolean)
      return {
        title: hardwareProfileCpu.model,
        subtitle: `Avg. last ${runs.length} runs: ${Math.round(
          runs.reduce(plus, 0) / runs.length
        )}ms`,
      }
    },
  },
}

const plus = (a, b) => a + b

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
