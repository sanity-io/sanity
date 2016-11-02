export default function cancelWrap(promise) {
  let hasCanceled = false

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(val => {
      if (hasCanceled) {
        resolve(val)
      }
    })
    promise.catch(error => {
      if (hasCanceled) {
        reject(error)
      }
    })
  })

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled = true
    }
  }
}
