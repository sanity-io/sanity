import through from 'through2'

const headStream = () => {
  const state = {rest: false}
  const stream = through(function write(chunk, enc, cb) {
    if (state.rest) {
      cb(null, chunk)
      return
    }

    state.resolve(chunk)
    state.rest = true
    this.push(chunk)
    cb()
  })

  stream.head = new Promise((resolve, reject) => {
    state.resolve = resolve
    state.reject = reject
  })

  return stream
}

export default headStream
