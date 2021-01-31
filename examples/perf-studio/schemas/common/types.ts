import prettyBytes from 'pretty-bytes'
import {PlugIcon} from '@sanity/icons'

export const cpu = {
  name: 'cpu',
  title: 'CPU',
  type: 'object',
  fields: [
    {name: 'model', type: 'string'}, //
    {name: 'speed', type: 'number'}, // (in MHz)
  ],
}

export const hardwareProfile = {
  name: 'hardwareProfile',
  type: 'document',
  icon: PlugIcon,
  fields: [
    {name: 'cpus', type: 'array', of: [{type: 'cpu'}], readOnly: true},
    {name: 'memory', type: 'number'},
  ],
  preview: {
    select: {
      cpus: 'cpus',
      memory: 'memory',
    },
    prepare({cpus, memory}) {
      return {
        title: `${cpus.length}x ${cpus[0].model} (${prettyBytes(memory, {bits: true})} mem)`,
      }
    },
  },
}

export const instance = {
  name: 'instance',
  title: 'Instance',
  type: 'object',
  liveEdit: true,
  preview: {
    select: {
      title: 'name',
    },
  },
  fields: [
    {name: 'name', title: 'Name', type: 'string'},
    {name: 'type', type: 'string', readOnly: true},
    {name: 'version', type: 'string', readOnly: true},
    {name: 'hostname', type: 'string', readOnly: true},
    {name: 'platform', type: 'string', readOnly: true},
    {name: 'hardwareProfile', type: 'reference', to: [{type: 'hardwareProfile'}]},
    {name: 'arch', type: 'string', readOnly: true},
    {
      name: 'memory',
      type: 'object',
      readOnly: true,
      fields: [
        {name: 'free', type: 'number'},
        {name: 'total', type: 'number'},
      ],
    },
    {name: 'uptime', type: 'number', readOnly: true},
    {
      name: 'loadavg',
      type: 'object',
      readOnly: true,
      fields: [
        {name: 'avg1m', type: 'number'},
        {name: 'avg5m', type: 'number'},
        {name: 'avg10m', type: 'number'},
      ],
    },
  ],
}
