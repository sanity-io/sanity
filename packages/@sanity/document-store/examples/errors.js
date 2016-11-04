const {Observable} = require('rxjs')

const serverConnection = {
  byId(id) {
    return Observable.of(1, 1, 0)
      .flatMap((n, i) => Observable.of(n).delay(i * 1000))
      .map(n => {
        if (n === 0) {
          throw new Error('Ooops, that failed')
        }
        return {type: 'OK', n: n}
      })
      .do(() => {
        console.log('Passing…')
      })
  }
}
// const createDocumentStore = require('../')
//
// const documents = createDocumentStore({serverConnection: serverConnection})

serverConnection.byId(12)
  .do(v => console.log(v))
  .retryWhen(errors => errors
    .do(error => console.log('Got error... retrying in 2s'))
    .delay(2000)
    .do(error => console.log('Retrying now'))
    .scan((count, error) => {
      console.log('retry count', count)
      return count + 1
    }, 0)
  )
  .subscribe(v => {})

// documents.byId('32')
//   .subscribe({
//     error(err) {
//       console.log('ERROR', err)
//     }
// })
