import richDate from './richDate'

let hasWarned = false
export default Object.assign({}, richDate, {
  get name() {
    if (!hasWarned) {
      console.warn('Heads up! The `date` type has been renamed to `richDate`. Please update your schema')
      hasWarned = true
    }
    return 'date'
  }
})
