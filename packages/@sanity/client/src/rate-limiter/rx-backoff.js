const {throwError, timer, iif} = require('rxjs')
const {concatMap, retryWhen, tap} = require('rxjs/operators')

function rxBackoff({
  maxRetryAttempts = 6,
  scalingDuration = 1000,
  initialDuration = 100,
  includedStatusCodes = []
}) {
  return source => {
    let count = 0
    return source.pipe(
      retryWhen(errors =>
        errors.pipe(
          concatMap(error => {
            const retryAttempt = count++
            return iif(
              () =>
                retryAttempt < maxRetryAttempts && includedStatusCodes.includes(error.statusCode),
              timer(Math.min(Math.pow(2, retryAttempt) * initialDuration, scalingDuration)),
              throwError(error)
            )
          })
        )
      ),
      tap(() => {
        count = 0
      })
    )
  }
}

module.exports = rxBackoff
