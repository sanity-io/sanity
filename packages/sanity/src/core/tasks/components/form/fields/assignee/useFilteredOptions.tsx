import {deburr} from 'lodash'
import {useMemo} from 'react'
import {type UserWithPermission} from 'sanity'

interface UseFilteredOptionsOptions {
  searchTerm: string
  options: UserWithPermission[]
}
export function useFilteredOptions({
  searchTerm = '',
  options = [],
}: UseFilteredOptionsOptions): UserWithPermission[] {
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options || []
    const deburredSearchTerm = deburr(searchTerm).toLocaleLowerCase()

    const deburredOptions = options?.map((option) => ({
      ...option,
      searchName: deburr(option.displayName || '').toLocaleLowerCase(),
    }))

    const filtered = deburredOptions
      ?.filter((option) => {
        return option?.searchName.includes(deburredSearchTerm)
      })
      // Sort by whether the displayName starts with the search term to get more relevant results first
      ?.sort((a, b) => {
        const matchA = a.searchName.startsWith(deburredSearchTerm)
        const matchB = b.searchName.startsWith(deburredSearchTerm)

        if (matchA && !matchB) return -1
        if (!matchA && matchB) return 1

        return 0
      })

    return filtered || []
  }, [options, searchTerm])
  return filteredOptions
}
