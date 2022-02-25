declare module 'config:@sanity/data-aspects'
declare module 'config:@sanity/default-login'
declare module 'config:@sanity/default-login?'
declare module 'config:@sanity/form-builder'
declare module 'config:@sanity/google-maps-input'
declare module 'config:@sanity/storybook'

declare module 'config:@sanity/default-layout' {
  const defaultLayoutConfig: {
    toolSwitcher?: {
      hidden?: string[]
      order?: string[]
    }
  }
  export default defaultLayoutConfig
}
