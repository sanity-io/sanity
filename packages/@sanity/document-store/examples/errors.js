const RxObservable = require('rxjs').Observable
const Observable = require('@sanity/observable')
const createDocumentStore = require('../src')
const mockServerConnection = require('./mock-db/mockServerConnection')

const serverConnection = {
  byId(id) {
    let attemptNo = 0
    return new Observable(observer => {
      observer.next(attemptNo++)
    })
      .flatMap(attemptNo => {
        if (attemptNo < 3) {
          throw new Error('Ooops, that failed')
        }
        return mockServerConnection.byId(id)
      })
  }
}

const documents = createDocumentStore({serverConnection: serverConnection})
// for some reason using documents ^ instead of serverConnection directly fails
RxObservable.from(serverConnection.byId(12))
  .retryWhen(errors => errors
    .do(err => {
      console.log('Got error: %s. Retrying...', err.message)
    })
    .delay(200)
    .scan((count, error) => {
      if (count > 4) {
        throw error
      }
      return count + 1
    }, 0)
  )
  .subscribe(document => {
    console.log('Finally got', document)
  })

// documents.byId('32')
//   .subscribe({
//     error(err) {
//       console.log('ERROR', err)
//     }
// })
