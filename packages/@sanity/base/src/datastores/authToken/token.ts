import type {SanityClient} from '@sanity/client'
import type {Observable} from 'rxjs'

// Project ID is part of the localStorage key so that different projects can store their separate tokens, and it's easier to do book keeping.
const getLSKey = (projectId: string) => {
  if (!projectId) {
    throw new Error('Invalid project id')
  }
  return `__studio_auth_token_${projectId}`
}

export const saveToken = ({token, projectId}: {token: string; projectId: string}): void => {
  try {
    window.localStorage.setItem(
      getLSKey(projectId),
      JSON.stringify({token, time: new Date().toISOString()})
    )
  } catch (err) {
    console.error(err)
  }
}

export const clearToken = (projectId: string): void => {
  try {
    window.localStorage.removeItem(getLSKey(projectId))
  } catch (err) {
    console.error(err)
  }
}

export const getToken = (projectId: string): string | null => {
  try {
    const item = window.localStorage.getItem(getLSKey(projectId))
    if (item) {
      const {token}: {token: string} = JSON.parse(item)
      if (token && typeof token === 'string') {
        return token
      }
    }
  } catch (err) {
    console.error(err)
  }
  return null
}

export const fetchToken = (sid: string, client: SanityClient): Observable<{token: string}> => {
  return client.observable.request({
    method: 'GET',
    uri: `/auth/fetch`,
    query: {sid},
    tag: 'auth.fetch-token',
  })
}
