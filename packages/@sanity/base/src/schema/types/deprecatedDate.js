import richDate from './richDate'
import generateHelpUrl from '@sanity/generate-help-url'

let hasWarned = false
export default Object.assign({}, richDate, {
  get name() {
    if (!hasWarned) {
      // eslint-disable-next-line no-console
      console.warn(
        'Heads up! The `date` type has been renamed to `richDate`. Please update your schema. See %s for more info.',
        generateHelpUrl('migrate-to-rich-date')
      )
      hasWarned = true
    }
    return 'date'
  }
})
