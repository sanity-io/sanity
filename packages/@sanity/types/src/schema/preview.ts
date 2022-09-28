import type {ReactNode, ElementType} from 'react'
import type {SortOrdering} from './types'

export interface PrepareViewOptions {
  ordering?: SortOrdering
}

export interface PreviewValue {
  title?: ReactNode | ElementType
  subtitle?: ReactNode | ElementType
  description?: ReactNode | ElementType
  media?: ReactNode | ElementType
  imageUrl?: string
}

export interface PreviewConfig<
  Select extends Record<string, string> = Record<string, string>,
  PrepareValue extends Record<keyof Select, any> = Record<keyof Select, any>
> {
  select?: Select
  prepare?: (value: PrepareValue, viewOptions?: PrepareViewOptions) => PreviewValue
}

function test<
  Select extends Record<string, string>,
  PrepareValue extends Record<keyof Select, any>
>(preview: PreviewConfig<Select, PrepareValue>) {
  return preview
}

const t = test({
  select: {
    title: 'title',
    subtitle: 'subtitle',
  },
  prepare({title}: {title: string}) {
    return {}
  },
})
