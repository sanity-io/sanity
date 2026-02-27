import {type DocGenTemplate} from '../types'

export const liveEdit: DocGenTemplate = (options) => ({
  _type: 'thesis',
  title: options.title,
})
