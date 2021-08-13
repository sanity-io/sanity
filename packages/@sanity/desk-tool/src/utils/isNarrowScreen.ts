const BREAKPOINT_SCREEN_MEDIUM = 512

export default function isNarrowScreen() {
  return typeof window === 'undefined' ? false : window.innerWidth < BREAKPOINT_SCREEN_MEDIUM
}
