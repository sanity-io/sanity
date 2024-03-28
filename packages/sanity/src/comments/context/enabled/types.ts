import {type CommentsUIMode} from '../../types'

export type CommentsEnabledContextValue =
  | {
      enabled: false
      mode: null
    }
  | {
      enabled: true
      mode: CommentsUIMode
    }
