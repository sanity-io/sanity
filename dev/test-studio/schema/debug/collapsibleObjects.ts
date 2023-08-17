export const collapsibleObjects = {
  name: 'collapsibleObjects',
  type: 'document',
  title: 'Collapsible objects',
  description: 'Collapsible objects test',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'simple',
      title: 'Simple collapsible object',
      description: 'This is collapsible collapsed initially',
      type: 'object',
      fields: [{name: 'name', type: 'string'}],
      options: {collapsed: true},
    },
    {
      name: 'simple2',
      title: 'Simple collapsible object',
      description: 'This is collapsible and expanded initially',
      type: 'object',
      fields: [{name: 'name', type: 'string'}],
      options: {collapsed: false},
    },
    {
      name: 'deepWithDefaults',
      title: 'Deep collapsible object with no collapsible configuration',
      description: 'This should be automatically collapsed at the current hard coded nesting level',
      type: 'object',
      fields: [nestFields(10, 'deep')],
    },
    {
      name: 'deepExpanded',
      title: 'Deep collapsible object with collapsed: false',
      description: 'This should be automatically collapsed at the current hard coded nesting level',
      type: 'object',
      fields: [nestFields(10, 'deep', {collapsed: false})],
    },
  ],
}

type CollapsibleOptions = {
  collapsed?: boolean
}

type FieldDef =
  | {name: string; type: 'string'}
  | {name: string; type: 'object'; options?: CollapsibleOptions; fields: FieldDef[]}

function nestFields(
  levels: number,
  fieldName: string,
  collapsibleOptions?: CollapsibleOptions,
): FieldDef {
  if (levels === 0) {
    return {name: fieldName, type: 'string'}
  }
  return {
    name: fieldName,
    type: 'object',
    options: collapsibleOptions,
    fields: [
      {name: 'stringField', type: 'string'},
      nestFields(levels - 1, fieldName, collapsibleOptions),
    ],
  }
}
