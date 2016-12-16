import getUri from 'get-uri'

export default uri => new Promise((resolve, reject) => {
  getUri(uri, (err, stream) => {
    if (err) {
      reject(err)
    } else {
      resolve(stream)
    }
  })
})
