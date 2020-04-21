/* eslint-disable @typescript-eslint/explicit-function-return-type */

const BREAKPOINT_SCREEN_MEDIUM = 512

export const HISTORY_LOADING = Symbol.for('HISTORY_LOADING')
export const historyIsEnabled = () => window && window.innerWidth > BREAKPOINT_SCREEN_MEDIUM
