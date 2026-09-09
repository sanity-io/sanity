import {defineLocalesResources} from '../helpers'
import {studioLocaleNamespace} from '../localeNamespaces'
import {type LocaleResourceBundle} from '../types'

// oxlint-disable-next-line no-deprecated -- internal helper keeps locale keys discoverable
const studioAuthLocaleStrings = defineLocalesResources('studio', {
  'login.logged-out.generic': 'Your session is no longer valid. Please sign in again.',
  'login.logged-out.session-expired': 'Your session expired. Please sign in again.',
  'login.logged-out.title': "You've been logged out",
})

export const studioAuthLocaleResources: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: studioLocaleNamespace,
  resources: studioAuthLocaleStrings,
}
