import {
  CalendarIcon,
  CheckmarkCircleIcon,
  DocumentIcon,
  ImageIcon,
  LinkIcon,
  PinIcon,
  SelectIcon,
  UlistIcon,
} from '@sanity/icons'
import {BlockContentIcon} from '../components/filters/icons/BlockContentIcon'
import {NumberIcon} from '../components/filters/icons/NumberIcon'
import {StringIcon} from '../components/filters/icons/StringIcon'
import {defineSearchFilter, SearchFilterDefinition} from './filters'
import {SearchOperatorType} from './operators/defaultOperators'

export const filterDefinitions: SearchFilterDefinition[] = [
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'array',
    icon: UlistIcon,
    operators: [
      {name: 'arrayCountEqual', type: 'item'},
      {name: 'arrayCountNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountGt', type: 'item'},
      {name: 'arrayCountGte', type: 'item'},
      {name: 'arrayCountLt', type: 'item'},
      {name: 'arrayCountLte', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountRange', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Array',
    type: 'array',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'boolean',
    icon: CheckmarkCircleIcon,
    operators: [
      {name: 'booleanEqual', type: 'item'},
      {type: 'divider'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Boolean',
    type: 'boolean',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'date',
    icon: CalendarIcon,
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
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'datetime',
    icon: CalendarIcon,
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
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'file',
    icon: DocumentIcon,
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'File',
    type: 'file',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'geopoint',
    icon: PinIcon,
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Geopoint',
    type: 'geopoint',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'image',
    icon: ImageIcon,
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Image',
    type: 'image',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'number',
    icon: NumberIcon,
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
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'array',
    icon: BlockContentIcon,
    operators: [
      {name: 'portableTextMatches', type: 'item'},
      {name: 'portableTextNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'portableTextEqual', type: 'item'},
      {name: 'portableTextNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Portable Text',
    type: 'portableText',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'reference',
    icon: LinkIcon,
    operators: [
      {name: 'referenceEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Reference',
    type: 'reference',
  }),
  defineSearchFilter<SearchOperatorType>({
    icon: LinkIcon,
    operators: [{name: 'references', type: 'item'}],
    title: 'Referenced document',
    type: 'references',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'slug',
    icon: StringIcon,
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
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'string',
    icon: StringIcon,
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
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'string',
    icon: SelectIcon,
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringListEqual', type: 'item'},
      {name: 'stringListNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'String (list)',
    type: 'stringList',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'text',
    icon: StringIcon,
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
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'url',
    icon: StringIcon,
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
  }),
]
