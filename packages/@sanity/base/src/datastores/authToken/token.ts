import {versionedClient} from '../../client/versionedClient'

// Project ID is part of the localStorage key so that different projects can store their separate tokens, and it's easier to do book keeping.
const getLSKey = (projectId: string) => {
  if (!projectId) {
    throw new Error('Invalid project id')
  }
  return `__studio_auth_token_${projectId}`
}

export const saveToken = ({token, projectId}: {token: string; projectId: string}): void => {
  window.localStorage.setItem(
    getLSKey(projectId),
    JSON.stringify({token, time: new Date().toISOString()})
  )
}

export const deleteToken = (projectId: string): void => {
  window.localStorage.removeItem(getLSKey(projectId))
}

export const getToken = (projectId: string): string | null => {
  const item = window.localStorage.getItem(getLSKey(projectId))
  if (item) {
    const {token} = JSON.parse(item)
    return token
  }
  return null
}

export const fetchToken = (sid: string): Promise<{token: string}> => {
  return versionedClient.request({
    method: 'GET',
    uri: `/auth/fetch?sid=${sid}`,
    tag: 'auth.fetch-token',
  })
}
