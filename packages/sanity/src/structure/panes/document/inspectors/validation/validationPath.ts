import {VALIDATION_PUBLISH_NOTICE_PARAM} from '../../constants'

/** Pane params for opening the inspector from a publish blocked by validation. */
export function publishValidationParams(): Record<string, string> {
  return {
    [VALIDATION_PUBLISH_NOTICE_PARAM]: String(Date.now()),
  }
}
