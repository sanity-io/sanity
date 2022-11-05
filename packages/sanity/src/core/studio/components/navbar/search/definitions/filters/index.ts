import {
  CalendarIcon,
  CheckmarkCircleIcon,
  DocumentIcon,
  ImageIcon,
  LinkIcon,
  PinIcon,
  UlistIcon,
} from '@sanity/icons'
import {NumberIcon} from '../../components/filters/icons/NumberIcon'
import {StringIcon} from '../../components/filters/icons/StringIcon'

// TODO: document
// These are filter DEFINITIONS and not saved filter STATE
// State is stored in local storage and shared documents

type Filter = typeof FILTERS[number]
export type FilterType = Filter['type']

export const FILTERS = [
  {
    fieldType: 'array',
    icon: UlistIcon,
    initialOperator: 'arrayCountEqual',
    operators: [
      {name: 'arrayCountEqual', type: 'item'},
      {name: 'arrayCountNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountGt', type: 'item'},
      {name: 'arrayCountGte', type: 'item'},
      {name: 'arrayCountLt', type: 'item'},
      {name: 'arrayCountLte', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Array',
    type: 'array',
  },
  {
    fieldType: 'boolean',
    icon: CheckmarkCircleIcon,
    initialOperator: 'booleanEqual',
    operators: [
      {name: 'booleanEqual', type: 'item'},
      {type: 'divider'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Boolean',
    type: 'boolean',
  },
  {
    fieldType: 'date',
    icon: CalendarIcon,
    initialOperator: 'dateLast',
    operators: [
      {name: 'dateLast', type: 'item'},
      {name: 'dateAfter', type: 'item'},
      {name: 'dateBefore', type: 'item'},
      {type: 'divider'},
      {name: 'dateRange', type: 'item'},
      {type: 'divider'},
      {name: 'dateEqual', type: 'item'},
      {name: 'dateNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Date',
    type: 'date',
  },
  {
    fieldType: 'datetime',
    icon: CalendarIcon,
    initialOperator: 'dateLast',
    operators: [
      {name: 'dateLast', type: 'item'},
      {name: 'dateAfter', type: 'item'},
      {name: 'dateBefore', type: 'item'},
      {type: 'divider'},
      {name: 'dateRange', type: 'item'},
      {type: 'divider'},
      {name: 'dateEqual', type: 'item'},
      {name: 'dateNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Datetime',
    type: 'datetime',
  },
  {
    fieldType: 'file',
    icon: DocumentIcon,
    initialOperator: 'defined',
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'File',
    type: 'file',
  },
  {
    fieldType: 'geopoint',
    icon: PinIcon,
    initialOperator: 'defined',
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Geopoint',
    type: 'geopoint',
  },
  {
    fieldType: 'image',
    icon: ImageIcon,
    initialOperator: 'defined',
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Image',
    type: 'image',
  },
  {
    fieldType: 'number',
    icon: NumberIcon,
    initialOperator: 'numberEqual',
    operators: [
      {name: 'numberEqual', type: 'item'},
      {name: 'numberNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'numberGt', type: 'item'},
      {name: 'numberGte', type: 'item'},
      {name: 'numberLt', type: 'item'},
      {name: 'numberLte', type: 'item'},
      {type: 'divider'},
      {name: 'numberRange', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Number',
    type: 'number',
  },
  {
    fieldType: 'reference',
    icon: LinkIcon,
    initialOperator: 'referenceEqual',
    operators: [
      {name: 'referenceEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Reference',
    type: 'reference',
  },
  {
    fieldType: null,
    icon: LinkIcon,
    initialOperator: 'references',
    operators: [{name: 'references', type: 'item'}],
    title: 'Referenced document',
    type: 'references',
  },
  {
    fieldType: 'slug',
    icon: StringIcon,
    initialOperator: 'stringMatches',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Slug',
    type: 'slug',
  },
  {
    fieldType: 'string',
    icon: StringIcon,
    initialOperator: 'stringMatches',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'String',
    type: 'string',
  },
  {
    fieldType: 'text',
    icon: StringIcon,
    initialOperator: 'stringMatches',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Text',
    type: 'text',
  },
  {
    fieldType: 'url',
    icon: StringIcon,
    initialOperator: 'stringMatches',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'URL',
    type: 'url',
  },
] as const

export function getFilter(filterType: FilterType): Filter | undefined {
  return FILTERS.find((filter) => filter.type === filterType)
}

export function getFilterInitialOperator(
  filterName: FilterType
): Filter['initialOperator'] | undefined {
  return getFilter(filterName)?.initialOperator
}
