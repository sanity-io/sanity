/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/export */
/* eslint-disable no-undef */

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/base/src/__legacy/@sanity/components/avatar'
}

declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/default' {
  export * from '@sanity/base/src/__legacy/@sanity/components/buttons/DefaultButton'
  export {default} from '@sanity/base/src/__legacy/@sanity/components/buttons/DefaultButton'
}

declare module 'part:@sanity/components/dialogs/popover-style'

declare module 'part:@sanity/components/fieldsets/default' {
  export default class DefaultFieldset extends React.PureComponent<any> {
    focus: () => void
  }
}

declare module 'part:@sanity/components/menu-button' {
  export * from '@sanity/base/src/__legacy/@sanity/components/menuButton'
}

declare module 'part:@sanity/components/layer' {
  export * from '@sanity/base/src/__legacy/@sanity/components/layer'
}

declare module 'part:@sanity/components/popover' {
  export * from '@sanity/base/src/__legacy/@sanity/components/popover'
}

declare module 'part:@sanity/components/portal' {
  export * from '@sanity/base/src/__legacy/@sanity/components/portal'
}

declare module 'part:@sanity/components/scroll' {
  export * from '@sanity/base/src/__legacy/@sanity/components/scroll'
}

declare module 'part:@sanity/components/selects/*' {
  export default class SanitySelectComponent extends React.Component<any> {
    focus: () => void
  }
}

declare module 'part:@sanity/components/tags/*' {
  export default class SanityTagsComponent extends React.Component<any> {
    focus: () => void
  }
}

declare module 'part:@sanity/components/textareas/*' {
  export default class SanityTextareaComponent extends React.Component<any> {
    focus: () => void
  }
}

declare module 'part:@sanity/components/textinputs/*' {
  export default class SanityTextinputComponent extends React.Component<any> {
    focus: () => void
  }
}

declare module 'part:@sanity/components/toggles/*' {
  export default class SanityToggleComponent extends React.Component<any> {
    focus: () => void
  }
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/base/src/__legacy/@sanity/components/tooltip'
}

declare module 'part:@sanity/components/dialogs/popover' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/dialogs/PopoverDialog'
}

declare module 'config:@sanity/form-builder'
declare module 'all:part:@sanity/form-builder/input/image/asset-source'

declare module 'part:@sanity/components/utilities/portal'
declare module 'part:@sanity/components/lists/*'
declare module 'part:@sanity/*'
