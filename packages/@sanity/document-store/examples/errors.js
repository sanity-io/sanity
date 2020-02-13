const rxjs = require('rxjs').from
const Observable = rxjs.Observable
observableFrom = rxjs.from
const {flatMap, tap, delay, scan} = require('rxjs/operators')
const createDocumentStore = require('../src')
const mockServerConnection = require('./mock-db/mockServerConnection')

const serverConnection = {
  byId(id) {
    let attemptNo = 0
    return new Observable(observer => {
      observer.next(attemptNo++)
    }).pipe(
      flatMap(attemptNo => {
        if (attemptNo < 3) {
          throw new Error('Ooops, that failed')
        }
        return mockServerConnection.byId(id)
      })
    )
  }
}

const documents = createDocumentStore({serverConnection: serverConnection})
// for some reason using documents ^ instead of serverConnection directly fails
observableFrom(serverConnection.byId(12))
  .retryWhen(errors =>
    errors.pipe(
      tap(err => {
        console.log('Got error: %s. Retrying...', err.message)
      }),
      delay(200),
      scan((count, error) => {
        if (count > 4) {
          throw error
        }
        return count + 1
      }, 0)
    )
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
