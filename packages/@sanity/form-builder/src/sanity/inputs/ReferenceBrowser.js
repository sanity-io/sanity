import {search, observeReferenceForPreview} from './client-adapters/reference'
import {ReferenceInput} from '../..'

export default ReferenceInput.createBrowser({
  searchFn: search,
  fetchValueFn: observeReferenceForPreview
})
