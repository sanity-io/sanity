interface TimeAgoOpts {
  minimal?: boolean
  agoSuffix?: boolean
}
export declare function useTimeAgo(time: Date | string, {minimal, agoSuffix}?: TimeAgoOpts): string
export {}
