import {lazy} from 'react'

// Operator definitions are evaluated while the workspace config is prepared, before the user
// has logged in. The value inputs they reference (date pickers, asset and reference pickers)
// are only rendered when a filter is edited in the search UI, so they load at that point.
// `FilterForm` provides the Suspense boundary.

// A factory like its eager counterpart: each operator gets a component bound to its asset type
export function SearchFilterAssetInput(type?: 'file' | 'image') {
  return lazy(() =>
    import('../../components/filters/filter/inputs/asset/Asset').then((module) => ({
      default: module.SearchFilterAssetInput(type),
    })),
  )
}

export const SearchFilterBooleanInput = lazy(() =>
  import('../../components/filters/filter/inputs/boolean/Boolean').then((module) => ({
    default: module.SearchFilterBooleanInput,
  })),
)

export const SearchFilterDateAfterInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateAfter').then((module) => ({
    default: module.SearchFilterDateAfterInput,
  })),
)

export const SearchFilterDateBeforeInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateBefore').then((module) => ({
    default: module.SearchFilterDateBeforeInput,
  })),
)

export const SearchFilterDateEqualInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateEqual').then((module) => ({
    default: module.SearchFilterDateEqualInput,
  })),
)

export const SearchFilterDateLastInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateLast').then((module) => ({
    default: module.SearchFilterDateLastInput,
  })),
)

export const SearchFilterDateRangeInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateRange').then((module) => ({
    default: module.SearchFilterDateRangeInput,
  })),
)

export const SearchFilterDateTimeAfterInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateTimeAfter').then((module) => ({
    default: module.SearchFilterDateTimeAfterInput,
  })),
)

export const SearchFilterDateTimeBeforeInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateTimeBefore').then((module) => ({
    default: module.SearchFilterDateTimeBeforeInput,
  })),
)

export const SearchFilterDateTimeEqualInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateTimeEqual').then((module) => ({
    default: module.SearchFilterDateTimeEqualInput,
  })),
)

export const SearchFilterDateTimeRangeInput = lazy(() =>
  import('../../components/filters/filter/inputs/date/DateTimeRange').then((module) => ({
    default: module.SearchFilterDateTimeRangeInput,
  })),
)

export const SearchFilterNumberInput = lazy(() =>
  import('../../components/filters/filter/inputs/number/Number').then((module) => ({
    default: module.SearchFilterNumberInput,
  })),
)

export const SearchFilterNumberRangeInput = lazy(() =>
  import('../../components/filters/filter/inputs/number/NumberRange').then((module) => ({
    default: module.SearchFilterNumberRangeInput,
  })),
)

export const SearchFilterReferenceInput = lazy(() =>
  import('../../components/filters/filter/inputs/reference/Reference').then((module) => ({
    default: module.SearchFilterReferenceInput,
  })),
)

export const SearchFilterStringInput = lazy(() =>
  import('../../components/filters/filter/inputs/string/String').then((module) => ({
    default: module.SearchFilterStringInput,
  })),
)

export const SearchFilterStringListInput = lazy(() =>
  import('../../components/filters/filter/inputs/string/StringList').then((module) => ({
    default: module.SearchFilterStringListInput,
  })),
)
