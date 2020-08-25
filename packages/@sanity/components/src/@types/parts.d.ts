/* eslint-disable react/no-multi-comp, @typescript-eslint/no-empty-function*/
declare module 'part:@sanity/components/*' {
  class SanityInputComponent extends React.Component<any> {
    focus() {}
  }
  export default SanityInputComponent
}

declare module 'part:@sanity/components/popover' {
  // export const Portal: ComponentType<{}>
  export const Popover: any
}

declare module 'part:@sanity/components/tooltip' {
  // export const Portal: ComponentType<{}>
  export const Tooltip: any
}

declare module 'part:@sanity/components/selects/*' {
  class SanitySelectComponent extends React.Component<any> {
    focus() {}
  }
  export default SanitySelectComponent
}

declare module 'part:@sanity/components/toggles/*' {
  class SanityToggleComponent extends React.Component<any> {
    focus() {}
  }
  export default SanityToggleComponent
}

declare module 'part:@sanity/components/tags/*' {
  class SanityTagsComponent extends React.Component<any> {
    focus() {}
  }
  export default SanityTagsComponent
}

declare module 'part:@sanity/components/textareas/*' {
  class SanityTextareaComponent extends React.Component<any> {
    focus() {}
  }
  export default SanityTextareaComponent
}

declare module 'config:@sanity/form-builder'
declare module 'all:part:@sanity/form-builder/input/image/asset-source'

declare module 'part:@sanity/components/utilities/portal'
declare module 'part:@sanity/components/lists/*'
declare module 'part:@sanity/*'
