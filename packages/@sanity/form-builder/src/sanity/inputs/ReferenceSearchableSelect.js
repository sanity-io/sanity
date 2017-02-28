import {search, valueToString} from './client-adapters/reference'
import {ReferenceInput} from '../..'

export default ReferenceInput.createSearchableSelect({
  searchFn: search,
  valueToString: valueToString
})
