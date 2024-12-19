import {isEqual} from 'lodash'
import {useState} from 'react'

/**
 * This React hook should be considered an escape hatch – to make sure that a value is the same
 * on every render. SHOULD NOT BE USED IN MOST CASES.
 * @deprecated please use `useMemo` and `useCallback` strategies instead to make deps stable, this hook runs comparisons on every single render and while each comparison can be fast, it quickly adds up
 *
 * @internal
 */
export function useUnique<ValueType>(value: ValueType): ValueType {
  const [previous, setPrevious] = useState(value)

  if (!isEqual(previous, value)) {
    setPrevious(value)
    return value
  }

  return previous
}
