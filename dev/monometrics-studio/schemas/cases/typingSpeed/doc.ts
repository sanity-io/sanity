import {TerminalIcon} from '@sanity/icons'

export const typingPerf = {
  type: 'document',
  name: 'typingPerfTest',
  title: 'Typing perf test document',
  icon: TerminalIcon,
  fields: [
    {
      name: 'rootStringField',
      type: 'string',
    },
  ],
}

export const deeplyNestedObject = {
  type: 'object',
  name: 'deeplyNestedObject',
  title: 'Deeply nested object',
  options: {collapsible: false, collapsed: false},
  fields: [
    {
      name: 'first',
      type: 'string',
      title: 'First',
    },
    {
      name: 'second',
      type: 'string',
      title: 'Second',
    },
    {
      name: 'myself',
      title: 'A field of my own type',
      type: 'deeplyNestedObject',
    },
  ],
}

// Todo add a case for typing speed on deeply nested objects
export const deeplyNestedObjectTest = {
  name: 'deeplyNestedObjectTest',
  type: 'document',
  title: 'Deeply nested Objects test',
  icon: TerminalIcon,
  preview: {
    select: {
      title: 'deeplyNestedObject.first',
    },
  },
  fields: [
    {
      name: 'deeplyNestedObject',
      type: 'deeplyNestedObject',
      title: 'A field of a deeplyNested object type',
    },
    ...[1, 2].map((n) => ({
      name: `myself${n}`,
      title: `Field ${n}`,
      type: 'deeplyNestedObject',
    })),
  ],
}
