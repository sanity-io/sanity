import {SanityClient} from '@sanity/client'
import {CorsOriginErrorOptions} from './CorsOriginError'

export const checkCors = (client: SanityClient): Promise<CorsOriginErrorOptions> => {
  const pingRequest = client.request({uri: '/ping', withCredentials: false}).then(() => true)
  const userRequest = client
    .request({uri: '/users/me', withCredentials: false})
    .then(() => true)
    .catch(() => false)

  const promise = Promise.all([pingRequest, userRequest]).then(
    ([pingResponded, userResponded]) => ({
      isCorsError: pingResponded && !userResponded,
      pingResponded: pingResponded,
    })
  )

  return promise
}
