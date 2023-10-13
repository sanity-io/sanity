import {useRelativeTime} from './useRelativeTime'

/** @internal */
export interface TimeAgoOpts {
  minimal?: boolean
  agoSuffix?: boolean
}

/**
 * @deprecated - Use {@link useRelativeTime} instead
 * @internal
 */
export function useTimeAgo(time: Date | string, options: TimeAgoOpts = {}): string {
  return useRelativeTime(time, {
    minimal: options.minimal,
    useTemporalPhrase: options.agoSuffix,
  })
}
