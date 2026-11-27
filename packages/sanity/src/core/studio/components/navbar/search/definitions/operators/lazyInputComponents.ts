import {lazy} from 'react'

// Operator definitions are evaluated while the workspace config is prepared, before the user
// has logged in. The value inputs they reference (date pickers, asset and reference pickers)
// are only rendered when a filter is edited in the search UI, so they load at that point.
// `FilterForm` provides the Suspense boundary.

// A factory like its eager counterpart: each operator gets a component bound to its asset type
export function SearchFilterAssetInput(type?: 'file' | 'image') {
  return lazy(() =>
    import('../../components/filters/filter/inputs/asset/Asset.lazy').then((module) => ({
      default: module.default(type),
    })),
  )
}

export const SearchFilterBooleanInput = lazy(
  () => import('../../components/filters/filter/inputs/boolean/Boolean.lazy'),
)

export const SearchFilterDateAfterInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateAfter.lazy'),
)

export const SearchFilterDateBeforeInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateBefore.lazy'),
)

export const SearchFilterDateEqualInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateEqual.lazy'),
)

export const SearchFilterDateLastInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateLast.lazy'),
)

export const SearchFilterDateRangeInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateRange.lazy'),
)

export const SearchFilterDateTimeAfterInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateTimeAfter.lazy'),
)

export const SearchFilterDateTimeBeforeInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateTimeBefore.lazy'),
)

export const SearchFilterDateTimeEqualInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateTimeEqual.lazy'),
)

export const SearchFilterDateTimeRangeInput = lazy(
  () => import('../../components/filters/filter/inputs/date/DateTimeRange.lazy'),
)

export const SearchFilterNumberInput = lazy(
  () => import('../../components/filters/filter/inputs/number/Number.lazy'),
)

export const SearchFilterNumberRangeInput = lazy(
  () => import('../../components/filters/filter/inputs/number/NumberRange.lazy'),
)

export const SearchFilterReferenceInput = lazy(
  () => import('../../components/filters/filter/inputs/reference/Reference.lazy'),
)

export const SearchFilterStringInput = lazy(
  () => import('../../components/filters/filter/inputs/string/String.lazy'),
)

export const SearchFilterStringListInput = lazy(
  () => import('../../components/filters/filter/inputs/string/StringList.lazy'),
)
