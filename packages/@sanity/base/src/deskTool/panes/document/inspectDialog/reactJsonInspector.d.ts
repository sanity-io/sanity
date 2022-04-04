// definitions derived from here:
// https://github.com/Lapple/react-json-inspector/tree/0b556535ba474f1c7241b678c6821d8bbf8060da
// TODO: remove this package dependency or fork it
declare module 'react-json-inspector' {
  export interface SearchBarProps {
    onChange: (query: string) => void
    data: unknown
    query: string
  }

  export interface InspectorProps {
    /**
     * JSON object or array to inspect.
     */
    data: unknown
    /**
     * The class name to be added to the root component element.
     */
    className?: string
    /**
     * Search bar component that accepts `onChange`, `data` and `query`
     * properties. Defaults to built-in search bar. Pass `false` to disable
     * search.
     */
    search?: React.ComponentType<SearchBarProps> | false
    /**
     * Optional parameters for search (toolbar). Must be an object.
     */
    searchOptions?: {
      /**
       * wait time (ms) between search field `onChange` events before actually
       * performing search. This can help provide a better user experience when
       * searching larger data sets. Defaults to `0`.
       */
      debounceTime?: number
    }
    /**
     * Optional initial search query, defaults to an empty string.
     */
    query?: string
    /**
     * Can be used to create custom input fields for JSON property names and
     * primitive values, see [#3][0] for more information.
     *
     * [0]: https://github.com/Lapple/react-json-inspector/issues/3
     */
    interactiveLabel?: React.ComponentType<{
      /**
       * either stringified property value or key value that is being interacted
       * with
       */
      value: string
      /**
       * either the original property value or key value,
       */
      originalValue: unknown
      /**
       * flag to differentiate between interacting with keys or properties,
       */
      isKey: boolean
      /**
       * keypath of the node being interacted with, will be the same for keys
       * and properties
       */
      keypath: string
    }>
    /**
     * Callback to be run whenever any key-value pair is clicked. Receives an
     * object with `key`, `value` and `path` properties.
     */
    onClick?: (options: {key: string; value: unknown; path: string}) => void
    /**
     * Function to check whether the entered search term is sufficient to query
     * data. Defaults to `(query) => query.length >= 2`.
     */
    validateQuery?: (query: string) => boolean
    /**
     * Optional predicate that can determine whether the leaf node should be
     * expanded on initial render. Receives two arguments: `keypath` and `value`.
     * Defaults to `(keypath, query) => false`.
     */
    isExpanded?: (keyPath: string, query: string) => boolean
    filterOptions?: {
      /**
       * Set to `false` to disable the filterer cache. This can sometimes
       * provide performance enhancements with larger data sets. Defaults to
       * `true`.
       */
      cacheResults?: boolean
      /**
       * Set to `true` to enable case insensitivity in search. Defaults to
       * `false`.
       */
      ignoreCase?: boolean
    }
    /**
     * Set to `true` for full showOriginal expansion of children containing
     * search term. Defaults to `false`.
     */
    verboseShowOriginal?: boolean
  }

  const Inspector: React.ComponentType<InspectorProps>

  export default Inspector
}
