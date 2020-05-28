export const files = [
  {
    name: '@sanity/base/src/styles/variables/brand-colors.css',
    vars: [
      {name: '--black'},
      {name: '--white'},
      {name: '--brand-darkest'},
      {name: '--brand-darkest--inverted'},
      {name: '--brand-lightest'},
      {name: '--brand-primary'},
      {name: '--brand-primary--inverted'},
      {name: '--brand-secondary'},
      {name: '--brand-secondary--inverted'},
      {name: '--gray-base'}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/code.css',
    vars: [
      /* Code */
      {name: '--code-bg'},
      {name: '--code-color'},

      /* KBD */
      {name: '--kbd-bg', deprecated: true},
      {name: '--kbd-color', deprecated: true},

      /* Pre */
      {name: '--pre-bg'},
      {name: '--pre-color'},
      {name: '--pre-border-color', deprecated: true},
      {name: '--pre-scrollable-max-height', type: 'size', deprecated: true}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/forms.css',
    vars: [
      {name: '--default-button-color'},
      {name: '--default-button-color--inverted'},
      {name: '--default-button-color--hover'},
      {name: '--default-button-color--active'},
      {name: '--button-border-radius', type: 'radius'},
      {name: '--input-bg'},
      {name: '--input-bg-focus'},
      {name: '--input-bg-invalid'},
      {name: '--input-bg-disabled'},
      {name: '--input-color'},
      {name: '--input-border-color'},
      {name: '--input-border-size', type: 'size'},
      {name: '--input-line-height', type: 'lineHeight'},
      {name: '--input-padding-vertical', type: 'size'},
      {name: '--input-padding-horizontal', type: 'size'},
      {name: '--input-border-radius', type: 'radius'},
      {name: '--input-border-radius-large', type: 'radius'},
      {name: '--input-border-radius-small', type: 'radius'},
      {name: '--input-border-color-hover'},
      {name: '--input-border-color-focus'},
      {name: '--input-border-color-active'},
      {name: '--input-border-color-invalid'},
      {name: '--focus-color'},
      {name: '--input-color-placeholder'},
      {name: '--label-color'},
      {name: '--legend-color'},
      {name: '--cursor-disabled', type: 'cursor'},
      {name: '--clear-cross-color'},
      {name: '--clear-cross-color-hover'},
      {name: '--input-box-shadow-base'},
      {name: '--input-box-shadow', type: 'shadow'},
      {name: '--input-box-shadow--hover', type: 'shadow'},
      {name: '--input-box-shadow--focus', type: 'shadow'},
      {name: '--input-box-shadow--invalid', type: 'shadow'},
      {name: '--input-box-shadow--invalid-focus', type: 'shadow'},

      /* fieldset */
      {name: '--fieldset-border', type: 'border'},
      {name: '--fieldset-box-shadow', type: 'shadow'},
      {name: '--fieldset-box-shadow--hover', type: 'shadow'},
      {name: '--fieldset-box-shadow--invalid', type: 'shadow'},
      {name: '--fieldset-box-shadow--focus', type: 'shadow'},
      {name: '--fieldset-box-shadow--invalid-focus', type: 'shadow'},
      {name: '--fieldset-bg'},
      {name: '--form-builder-block-border-color'},
      {name: '--form-builder-block-border-color-focus'},
      {name: '--form-builder-block-border-color-error'},
      {name: '--form-builder-block-background'},
      {name: '--form-builder-block-background-hover'},
      {name: '--form-builder-block-background-selected'},
      {name: '--form-builder-block-shadow', type: 'shadow'},
      {name: '--form-builder-block-shadow--hover', type: 'shadow'},
      {name: '--form-builder-block-shadow--focus', type: 'shadow'},
      {name: '--form-builder-block-shadow--invalid', type: 'shadow'},
      {name: '--form-builder-block-shadow--invalid-focus', type: 'shadow'},
      {name: '--form-builder-block-border-radius', type: 'radius'}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/globals.css',
    vars: [
      // Body
      {name: '--body-bg'},
      {name: '--body-text'},

      // Component
      {name: '--component-bg'},
      {name: '--component-text-color'},
      {name: '--component-border-color'},

      // Preview
      {name: '--preview-placeholder-color'},

      // Backdrop
      {name: '--backdrop-color'},

      // Main navigation
      {name: '--main-navigation-color'},
      {name: '--main-navigation-color--inverted'},

      // Dialog
      {name: '--dialog-header-color'},
      {name: '--dialog-header-color--inverted'},

      // Header
      {name: '--header-height'},

      // Checkerboard
      {name: '--checkerboard-color'},

      // Selectable item
      {name: '--selectable-item-base'},

      // Hairline
      {name: '--hairline-color'},

      // Default button
      {name: '--default-button-primary-color'},
      {name: '--default-button-primary-color--inverted'},
      {name: '--default-button-danger-color'},
      {name: '--default-button-danger-color--inverted'},
      {name: '--default-button-success-color'},
      {name: '--default-button-success-color--inverted'},
      {name: '--default-button-warning-color'},
      {name: '--default-button-warning-color--inverted'},

      // Shadow
      {name: '--shadow-base'},
      {name: '--shadow-color-umbra'},
      {name: '--shadow-color-penumbra'},
      {name: '--shadow-color-ambient'},

      // Border radius
      {name: '--border-radius-base', type: 'radius'},
      {name: '--border-radius-large', type: 'radius'},
      {name: '--border-radius-medium', type: 'radius'},
      {name: '--border-radius-small', type: 'radius'},

      // Padding
      {name: '--extra-small-padding', type: 'size'},
      {name: '--small-padding', type: 'size'},
      {name: '--medium-padding', type: 'size'},
      {name: '--large-padding', type: 'size'},
      {name: '--extra-large-padding', type: 'size'},
      {name: '--extra-small-padding--em', type: 'size'},
      {name: '--small-padding--em', type: 'size'},
      {name: '--medium-padding--em', type: 'size'},
      {name: '--large-padding--em', type: 'size'},
      {name: '--extra-large-padding--em', type: 'size'},
      {name: '--text-selection-color'},

      // Block editor
      {name: '--block-editor-base-font-family', type: 'font'},
      {name: '--block-editor-header-font-family', type: 'font'},
      {name: '--block-extras-width', type: 'size'},
      {name: '--block-extras-border-color'},
      {name: '--block-extras-background-color'},

      // Pane
      {name: '--pane-header-height', type: 'size'}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/gray-colors.css',
    vars: [
      {name: '--gray-darkest'},
      {name: '--gray-darkest--transparent', deprecated: true},
      {name: '--gray-darker'},
      {name: '--gray-darker-transparent', deprecated: true},
      {name: '--gray-dark'},
      {name: '--gray-dark--transparent', deprecated: true},
      {name: '--gray'},
      {name: '--gray--transparent', deprecated: true},
      {name: '--gray-light'},
      {name: '--gray-light--transparent', deprecated: true},
      {name: '--gray-lighter'},
      {name: '--gray-lighter--transparent', deprecated: true},
      {name: '--gray-lightest'},
      {name: '--gray-lightest--transparent', deprecated: true}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/list.css',
    vars: [{name: '--list-border-color'}, {name: '--list-border', type: 'border'}]
  },

  {
    name: '@sanity/base/src/styles/variables/progress.css',
    vars: [
      {name: '--progress-bg'},
      {name: '--progress-bar-color'},
      {name: '--progress-border-radius', type: 'radius'},
      {name: '--progress-bar-bg'},
      {name: '--progress-bar-success-bg'},
      {name: '--progress-bar-warning-bg'},
      {name: '--progress-bar-danger-bg'},
      {name: '--progress-bar-info-bg'}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/selectable-item.css',
    vars: [
      {name: '--selectable-item-color'},
      {name: '--selectable-item-color--inverted'},
      {name: '--selectable-item-color-hover'},
      {name: '--selectable-item-color-hover--inverted'},
      {name: '--selectable-item-color-focus'},
      {name: '--selectable-item-color-focus--inverted'},
      {name: '--selectable-item-color-active'},
      {name: '--selectable-item-color-active--inverted'},
      {name: '--selectable-item-color-highlighted'},
      // Selected Item
      {name: '--selected-item-color'},
      {name: '--selected-item-color--inverted'},
      {name: '--selected-item-color-hover'},
      {name: '--selected-item-color-hover--inverted'}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/state-colors.css',
    vars: [
      {name: '--state-success-color'},
      {name: '--state-success-color--faded'},
      {name: '--state-success-color--strong'},
      {name: '--state-success-color--inverted'},
      {name: '--state-info-color'},
      {name: '--state-info-color--faded'},
      {name: '--state-info-color--strong'},
      {name: '--state-info-color--inverted'},
      {name: '--state-warning-color'},
      {name: '--state-warning-color--faded'},
      {name: '--state-warning-color--strong'},
      {name: '--state-warning-color--inverted'},
      {name: '--state-danger-color'},
      {name: '--state-danger-color--faded'},
      {name: '--state-danger-color--strong'},
      {name: '--state-danger-color--inverted'}
    ]
  },

  {
    name: '@sanity/base/src/styles/variables/typography.css',
    vars: [
      {name: '--text-color', type: 'color'},
      {name: '--text-color-secondary', type: 'color'},
      {name: '--text-muted', type: 'color'},
      {name: '--link-color', type: 'color'},
      {name: '--link-hover-color', type: 'color'},
      {name: '--font-family-sans-serif', type: 'font'},
      {name: '--font-family-serif', type: 'font'},
      {name: '--font-family-monospace', type: 'font'},
      {name: '--font-family-base', type: 'font'},
      {name: '--font-size-base', type: 'fontSize'},
      {name: '--font-size-huge', type: 'fontSize'},
      {name: '--font-size-large', type: 'fontSize'},
      {name: '--font-size-small', type: 'fontSize'},
      {name: '--font-size-xsmall', type: 'fontSize'},
      {name: '--font-size-xsmall--uppercase', type: 'fontSize'},
      {name: '--font-size-tiny', type: 'fontSize'},
      {name: '--font-size-base--relative', type: 'fontSize'},
      {name: '--font-size-large--relative', type: 'fontSize'},
      {name: '--font-size-xsmall--relative-uppercase', type: 'fontSize'},
      {name: '--font-size-xsmall--relative', type: 'fontSize'},
      {name: '--font-size-tiny--relative', type: 'fontSize'},
      {name: '--font-size-h1', type: 'fontSize'},
      {name: '--font-size-h2', type: 'fontSize'},
      {name: '--font-size-h3', type: 'fontSize'},
      {name: '--font-size-h4', type: 'fontSize'},
      {name: '--font-size-h5', type: 'fontSize'},
      {name: '--font-size-h6', type: 'fontSize'},
      {name: '--line-height-base', type: 'lineHeight'},
      {name: '--line-height-computed', type: 'lineHeight'},
      {name: '--headings-font-family', type: 'font'},
      {name: '--headings-font-weight', type: 'fontWeight'},
      {name: '--headings-line-height', type: 'lineHeight'},
      {name: '--headings-color', type: 'color'},
      {name: '--blockquote-color', type: 'color'},
      {name: '--blockquote-font-size', type: 'fontSize'},
      {name: '--blockquote-border-color', type: 'color'},
      // {name: '--blockquote-small-color', type: 'color'},
      {name: '--page-header-border-color', type: 'color'},
      {name: '--hr-border', type: 'color'},
      {name: '--preview-placeholder-text-color', type: 'color'},
      {name: '--icon-size', type: 'size'}
    ]
  }
]
