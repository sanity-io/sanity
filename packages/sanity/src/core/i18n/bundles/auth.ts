import {defineLocalesResources} from '../helpers'
import {studioLocaleNamespace} from '../localeNamespaces'
import {type LocaleResourceBundle} from '../types'

// oxlint-disable-next-line no-deprecated -- internal helper keeps locale keys discoverable
export const studioAuthLocaleStrings = defineLocalesResources('studio', {
  'login.logged-out.generic': 'Your session is no longer valid. Please sign in again.',
  'login.logged-out.session-expired': 'Your session expired. Please sign in again.',
  'login.logged-out.title': "You've been logged out",
  'workspaces.action.add-workspace': 'Add workspace',
  'workspaces.action.choose-another-workspace': 'Choose another workspace',
  'workspaces.choose-your-workspace-label': 'Choose your workspace',
})

export const studioAuthLocaleResources: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: studioLocaleNamespace,
  resources: studioAuthLocaleStrings,
}
