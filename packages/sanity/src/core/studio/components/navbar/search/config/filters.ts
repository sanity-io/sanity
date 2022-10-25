import {
  CalendarIcon,
  CheckmarkCircleIcon,
  DocumentIcon,
  ImageIcon,
  LinkIcon,
  PinIcon,
  UlistIcon,
} from '@sanity/icons'
import {ComponentType} from 'react'
import type {CompoundSearchFilter, FieldSearchFilter, SearchOperatorType} from '../types'
import {CompoundContentHasDraft} from '../components/filters/compound/HasDraft'
import {CompoundContentHasReferences} from '../components/filters/compound/HasReferences'
import {CompoundContentIsPublished} from '../components/filters/compound/IsPublished'
import {CompoundContentProps} from '../components/filters/compound/types'
import {NumberIcon} from '../components/filters/icons/NumberIcon'
import {StringIcon} from '../components/filters/icons/StringIcon'
import {
  ARRAY_FORM_STATES,
  ASSET_FORM_STATES,
  BOOLEAN_FORM_STATES,
  DATE_FORM_STATES,
  GEOPOINT_FORM_STATES,
  NUMBER_FORM_STATES,
  REFERENCE_FORM_STATES,
  STRING_FORM_STATES,
} from './formStates'
import type {FilterInputType} from './inputTypes'

export type FilterFormState = {
  initialValue: any
  input?: FilterInputType
  operator: SearchOperatorType
}

export const FILTERS: {
  compound: Record<
    CompoundSearchFilter['id'],
    {
      content: ComponentType<CompoundContentProps>
      icon: ComponentType
      initialValue: any
      // label: string
    }
  >
  field: Record<
    FieldSearchFilter['fieldType'],
    {
      icon: ComponentType
      // label: string
      form: FilterFormState[]
    }
  >
} = {
  compound: {
    hasDraft: {
      content: CompoundContentHasDraft,
      icon: CheckmarkCircleIcon,
      initialValue: true,
      // label: 'Has draft',
    },
    hasReference: {
      content: CompoundContentHasReferences,
      icon: LinkIcon,
      initialValue: null,
      // label: 'Has reference',
    },
    isPublished: {
      content: CompoundContentIsPublished,
      icon: CheckmarkCircleIcon,
      initialValue: true,
      // label: 'Is published',
    },
  },
  field: {
    array: {
      icon: UlistIcon,
      form: ARRAY_FORM_STATES,
    },
    boolean: {
      icon: CheckmarkCircleIcon,
      form: BOOLEAN_FORM_STATES,
    },
    date: {
      icon: CalendarIcon,
      // TODO: correctly type
      form: DATE_FORM_STATES,
    },
    datetime: {
      icon: CalendarIcon,
      form: DATE_FORM_STATES,
    },
    file: {
      icon: DocumentIcon,
      form: ASSET_FORM_STATES,
    },
    geopoint: {
      icon: PinIcon,
      form: GEOPOINT_FORM_STATES,
    },
    image: {
      icon: ImageIcon,
      form: ASSET_FORM_STATES,
    },
    number: {
      icon: NumberIcon,
      form: NUMBER_FORM_STATES,
    },
    reference: {
      icon: LinkIcon,
      form: REFERENCE_FORM_STATES,
    },
    slug: {
      icon: StringIcon,
      form: STRING_FORM_STATES,
    },
    string: {
      icon: StringIcon,
      form: STRING_FORM_STATES,
    },
    text: {
      icon: StringIcon,
      form: STRING_FORM_STATES,
    },
    url: {
      icon: StringIcon,
      form: STRING_FORM_STATES,
    },
  },
}
