import settings from 'part:@sanity/base/settings'
import studioClient from 'part:@sanity/base/client'

const storageKey = 'studio-hints'
const studioHintsSettings = settings.forNamespace(storageKey)
const client = studioClient.withConfig({apiVersion: '1'})

export const locationSetting = studioHintsSettings.forKey('location')

// The shape of locationObject is
// {type: 'hint', id: '123lkhlkh-234kwe3-45'} || null
// It's only set if the user has "drilled down" to a specific object
export function updateLocation(locationObject) {
  locationSetting.set(locationObject ? JSON.stringify(locationObject) : undefined)
}

export const getHints = (templateRepoId, removeHintsArticleSlug) => {
  const uri = `/addons/dashboard/hints?templateRepoId=${templateRepoId}&removeHintsArticleSlug=${removeHintsArticleSlug}`
  return client.observable.request({uri, withCredentials: false})
}
