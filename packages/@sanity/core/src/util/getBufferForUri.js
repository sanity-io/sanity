import simpleConcat from 'simple-concat'
import getStreamForUri from './getStreamForUri'

export default async uri => {
  const stream = await getStreamForUri(uri)

  return new Promise((resolve, reject) => {
    simpleConcat(stream, (err, buffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(buffer)
      }
    })
  })
}
