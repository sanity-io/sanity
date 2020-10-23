export default {
  groups: [
    {
      name: 'screen',
      properties: [
        {name: '--screen-medium-break', type: 'size'},
        {name: '--screen-large-break', type: 'size'},
        {name: '--screen-xlarge-break', type: 'size'},
      ],
    },

    {
      name: 'base-colors',
      properties: [
        {name: '--black', type: 'color'},
        {name: '--white', type: 'color'},
        {name: '--gray-base', type: 'color'},
      ],
    },

    {
      name: 'brand',
      properties: [
        {name: '--brand-darkest', type: 'color'},
        {name: '--brand-darkest--inverted', type: 'color'},
        {name: '--brand-lightest', type: 'color'},
        {name: '--brand-primary', type: 'color'},
        {name: '--brand-primary--inverted', type: 'color'},
        {name: '--brand-secondary', type: 'color'},
        {name: '--brand-secondary--inverted', type: 'color'},
        {name: '--brand-faded', type: 'color'},
      ],
    },
    {
      name: 'gray',
      properties: [
        {name: '--gray-darkest', type: 'color'},
        {name: '--gray-darker', type: 'color'},
        {name: '--gray-dark', type: 'color'},
        {name: '--gray', type: 'color'},
        {name: '--gray-light', type: 'color'},
        {name: '--gray-lighter', type: 'color'},
        {name: '--gray-lighter', type: 'color'},
        {name: '--gray-lightest', type: 'color'},

        {name: '--gray-darkest--transparent', type: 'color'},
        {name: '--gray-darker-transparent', type: 'color'},
        {name: '--gray-dark--transparent', type: 'color'},
        {name: '--gray--transparent', type: 'color'},
        {name: '--gray-light--transparent', type: 'color'},
        {name: '--gray-lighter--transparent', type: 'color'},
        {name: '--gray-lightest--transparent', type: 'color'},
      ],
    },
    {
      name: 'code',
      properties: [
        {name: '--code-bg', type: 'color'},
        {name: '--code-color', type: 'color'},
      ],
    },
    {
      name: 'kbd',
      properties: [
        {name: '--kbd-bg', type: 'color'},
        {name: '--kbd-color', type: 'color'},
      ],
    },
    {
      name: 'pre',
      properties: [
        {name: '--pre-bg', type: 'color'},
        {name: '--pre-color', type: 'color'},
        {name: '--pre-border-color', type: 'color'},
        {name: '--pre-scrollable-max-height', type: 'size'},
      ],
    },
    {
      name: 'body',
      properties: [
        {name: '--body-bg', type: 'color'},
        {name: '--body-text', type: 'color'},
      ],
    },
    {
      name: 'component',
      properties: [
        {name: '--component-bg', type: 'color'},
        {name: '--component-text-color', type: 'color'},
        {name: '--component-border-color', type: 'color'},
      ],
    },
    {
      name: 'preview',
      properties: [
        {name: '--preview-placeholder-color', type: 'color'},
        {
          name: '--preview-placeholder-text-color',
          type: 'color',
        },
      ],
    },
    {
      name: 'backdrop',
      properties: [{name: '--backdrop-color', type: 'color'}],
    },
    {
      name: 'main-navigation',
      properties: [
        {name: '--main-navigation-color', type: 'color'},
        {name: '--main-navigation-color--inverted', type: 'color'},
      ],
    },
    {
      name: 'dialog',
      properties: [
        {name: '--dialog-header-color', type: 'color'},
        {name: '--dialog-header-color--inverted', type: 'color'},
      ],
    },
    {
      name: 'default-button',
      properties: [
        {name: '--default-button-color', type: 'color'},
        {name: '--default-button-color--inverted', type: 'color'},
        {name: '--default-button-color--hover', type: 'color'},
        {name: '--default-button-color--active', type: 'color'},

        {name: '--default-button-primary-color', type: 'color'},
        {name: '--default-button-primary-color--inverted', type: 'color'},

        {name: '--default-button-danger-color', type: 'color'},
        {name: '--default-button-danger-color--inverted', type: 'color'},

        {name: '--default-button-success-color', type: 'color'},
        {name: '--default-button-success-color--inverted', type: 'color'},

        {name: '--default-button-warning-color', type: 'color'},
        {name: '--default-button-warning-color--inverted', type: 'color'},
      ],
    },

    {
      name: 'header',
      properties: [{name: '--header-height', type: 'size'}],
    },

    {
      name: 'checkerboard',
      properties: [{name: '--checkerboard-color', type: 'color'}],
    },

    {
      name: 'hairline',
      properties: [{name: '--hairline-color', type: 'color'}],
    },

    {
      name: 'shadow',
      properties: [
        {name: '--shadow-base', type: 'color'},
        {name: '--shadow-color-umbra', type: 'color'},
        {name: '--shadow-color-penumbra', type: 'color'},
        {name: '--shadow-color-ambient', type: 'color'},
      ],
    },

    {
      name: 'border-radius',
      properties: [
        {name: '--border-radius-base', type: 'border-radius'},
        {name: '--border-radius-large', type: 'border-radius'},
        {name: '--border-radius-medium', type: 'border-radius'},
        {name: '--border-radius-small', type: 'border-radius'},
      ],
    },

    {
      name: 'padding',
      properties: [
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
      ],
    },

    {
      name: 'text-selection',
      properties: [{name: '--text-selection-color', type: 'color'}],
    },

    {
      name: 'block-editor',
      properties: [
        {name: '--block-editor-base-font-family', type: 'font-family'},
        {name: '--block-editor-header-font-family', type: 'font-family'},
      ],
    },

    {
      name: 'block-extras',
      properties: [
        {name: '--block-extras-width', type: 'size'},
        {name: '--block-extras-border-color', type: 'color'},
        {name: '--block-extras-background-color', type: 'color'},
      ],
    },

    {
      name: 'pane-header',
      properties: [{name: '--pane-header-height', type: 'size'}],
    },

    {
      name: 'button',
      properties: [{name: '--button-border-radius', type: 'border-radius'}],
    },

    {
      name: 'input',
      properties: [
        {name: '--input-bg', type: 'color'},
        {name: '--input-bg-focus', type: 'color'},
        {name: '--input-bg-invalid', type: 'color'},
        {name: '--input-bg-disabled', type: 'color'},
        {name: '--input-color', type: 'color'},
        {name: '--input-color-disabled', type: 'color'},
        {name: '--input-border-color', type: 'color'},
        {name: '--input-border-size', type: 'border-width'},
        {name: '--input-line-height', type: 'line-height'},
        {name: '--input-padding-vertical', type: 'size'},
        {name: '--input-padding-horizontal', type: 'size'},
        {name: '--input-border-radius', type: 'border-radius'},
        {name: '--input-border-radius-large', type: 'border-radius'},
        {name: '--input-border-radius-small', type: 'border-radius'},
        {name: '--input-border-color-hover', type: 'color'},
        {name: '--input-border-color-focus', type: 'color'},
        {name: '--input-border-color-active', type: 'color'},
        {name: '--input-border-color-invalid', type: 'color'},
        {name: '--input-color-placeholder', type: 'color'},
        {name: '--input-box-shadow-base', type: 'color'},
        {name: '--input-box-shadow', type: 'box-shadow'},
        {name: '--input-box-shadow--hover', type: 'box-shadow'},
        {name: '--input-box-shadow--focus', type: 'box-shadow'},
        {name: '--input-box-shadow--invalid', type: 'box-shadow'},
        {name: '--input-box-shadow--invalid-focus', type: 'box-shadow'},
      ],
    },

    {
      name: 'focus',
      properties: [{name: '--focus-color', type: 'color'}],
    },

    {
      name: 'label',
      properties: [{name: '--label-color', type: 'color'}],
    },

    {
      name: 'legend',
      properties: [{name: '--legend-color', type: 'color'}],
    },

    {
      name: 'cursor',
      properties: [{name: '--cursor-disabled', type: 'cursor'}],
    },

    {
      name: 'clear-cross',
      properties: [
        {name: '--clear-cross-color', type: 'color'},
        {name: '--clear-cross-color-hover', type: 'color'},
      ],
    },

    {
      name: 'fieldset',
      properties: [
        {name: '--fieldset-border', type: 'border'},
        {name: '--fieldset-box-shadow', type: 'box-shadow'},
        {name: '--fieldset-box-shadow--hover', type: 'box-shadow'},
        {name: '--fieldset-box-shadow--invalid', type: 'box-shadow'},
        {name: '--fieldset-box-shadow--focus', type: 'box-shadow'},
        {name: '--fieldset-box-shadow--invalid-focus', type: 'box-shadow'},
        {name: '--fieldset-bg', type: 'color'},
      ],
    },

    {
      name: 'form-builder-block',
      properties: [
        {name: '--form-builder-block-border-color', type: 'color'},
        {name: '--form-builder-block-border-color-focus', type: 'color'},
        {name: '--form-builder-block-border-color-error', type: 'color'},
        {name: '--form-builder-block-background', type: 'color'},
        {name: '--form-builder-block-background-hover', type: 'color'},
        {name: '--form-builder-block-background-selected', type: 'color'},
        {name: '--form-builder-block-shadow', type: 'box-shadow'},
        {name: '--form-builder-block-shadow--hover', type: 'box-shadow'},
        {name: '--form-builder-block-shadow--focus', type: 'box-shadow'},
        {name: '--form-builder-block-shadow--invalid', type: 'box-shadow'},
        {name: '--form-builder-block-shadow--invalid-focus', type: 'box-shadow'},
        {name: '--form-builder-block-border-radius', type: 'border-radius'},
      ],
    },

    {
      name: 'zindex',
      properties: [
        {name: '--zindex-pane', type: 'z-index'},
        {name: '--zindex-navbar', type: 'z-index'},
        {name: '--zindex-navbar-fixed', type: 'z-index'},
        {name: '--zindex-dropdown', type: 'z-index'},
        {name: '--zindex-fullscreen-edit', type: 'z-index'},
        {name: '--zindex-portal', type: 'z-index'},
        {name: '--zindex-popover-background', type: 'z-index'},
        {name: '--zindex-popover', type: 'z-index'},
        {name: '--zindex-tooltip', type: 'z-index'},
        {name: '--zindex-modal-background', type: 'z-index'},
        {name: '--zindex-modal', type: 'z-index'},
        {name: '--zindex-moving-item', type: 'z-index'},
        {name: '--zindex-spinner', type: 'z-index'},
        {name: '--zindex-drawershade', type: 'z-index'},
        {name: '--zindex-drawer', type: 'z-index'},
      ],
    },

    {
      name: 'list-border',
      properties: [
        {name: '--list-border-color', type: 'color'},
        {name: '--list-border', type: 'border'},
      ],
    },

    {
      name: 'progress',
      properties: [
        {name: '--progress-bg', type: 'color'},
        {name: '--progress-bar-color', type: 'color'},
        {name: '--progress-border-radius', type: 'border-radius'},
        {name: '--progress-bar-bg', type: 'color'},
        {name: '--progress-bar-success-bg', type: 'color'},
        {name: '--progress-bar-warning-bg', type: 'color'},
        {name: '--progress-bar-danger-bg', type: 'color'},
        {name: '--progress-bar-info-bg', type: 'color'},
      ],
    },

    {
      name: 'selectable-item',
      properties: [
        {name: '--selectable-item-base', type: 'color'},
        {name: '--selectable-item-color', type: 'color'},
        {name: '--selectable-item-color--inverted', type: 'color'},
        {name: '--selectable-item-color-hover', type: 'color'},
        {name: '--selectable-item-color-hover--inverted', type: 'color'},
        {name: '--selectable-item-color-focus', type: 'color'},
        {name: '--selectable-item-color-focus--inverted', type: 'color'},
        {name: '--selectable-item-color-active', type: 'color'},
        {name: '--selectable-item-color-active--inverted', type: 'color'},
        {name: '--selectable-item-color-highlighted', type: 'color'},
      ],
    },

    {
      name: 'selected-item',
      properties: [
        {name: '--selected-item-color', type: 'color'},
        {name: '--selected-item-color--inverted', type: 'color'},
        {name: '--selected-item-color-hover', type: 'color'},
        {name: '--selected-item-color-hover--inverted', type: 'color'},
      ],
    },

    {
      name: 'state',
      properties: [
        {name: '--state-success-color', type: 'color'},
        {name: '--state-success-color--faded', type: 'color'},
        {name: '--state-success-color--strong', type: 'color'},
        {name: '--state-success-color--inverted', type: 'color'},
        {name: '--state-info-color', type: 'color'},
        {name: '--state-info-color--faded', type: 'color'},
        {name: '--state-info-color--strong', type: 'color'},
        {name: '--state-info-color--inverted', type: 'color'},
        {name: '--state-warning-color', type: 'color'},
        {name: '--state-warning-color--faded', type: 'color'},
        {name: '--state-warning-color--strong', type: 'color'},
        {name: '--state-warning-color--inverted', type: 'color'},
        {name: '--state-danger-color', type: 'color'},
        {name: '--state-danger-color--faded', type: 'color'},
        {name: '--state-danger-color--strong', type: 'color'},
        {name: '--state-danger-color--inverted', type: 'color'},
      ],
    },

    {
      name: 'text',
      properties: [
        {name: '--text-color', type: 'color'},
        {name: '--text-color-secondary', type: 'color'},
        {name: '--text-muted', type: 'color'},
      ],
    },

    {
      name: 'link',
      properties: [
        {name: '--link-color', type: 'color'},
        {name: '--link-hover-color', type: 'color'},
      ],
    },

    {
      name: 'typography',
      properties: [
        {name: '--font-family-sans-serif', type: 'font-family'},
        {name: '--font-family-serif', type: 'font-family'},
        {name: '--font-family-monospace', type: 'font-family'},
        {name: '--font-family-base', type: 'font-family'},
        {name: '--font-size-base', type: 'font-size'},
        {name: '--font-size-huge', type: 'font-size'},
        {name: '--font-size-large', type: 'font-size'},
        {name: '--font-size-small', type: 'font-size'},
        {name: '--font-size-xsmall', type: 'font-size'},
        {name: '--font-size-xsmall--uppercase', type: 'font-size'},
        {name: '--font-size-tiny', type: 'font-size'},
        {name: '--font-size-base--relative', type: 'font-size'},
        {name: '--font-size-large--relative', type: 'font-size'},
        {name: '--font-size-xsmall--relative-uppercase', type: 'font-size'},
        {name: '--font-size-xsmall--relative', type: 'font-size'},
        {name: '--font-size-tiny--relative', type: 'font-size'},
        {name: '--font-size-h1', type: 'font-size'},
        {name: '--font-size-h2', type: 'font-size'},
        {name: '--font-size-h3', type: 'font-size'},
        {name: '--font-size-h4', type: 'font-size'},
        {name: '--font-size-h5', type: 'font-size'},
        {name: '--font-size-h6', type: 'font-size'},
        {name: '--line-height-base', type: 'line-height'},
        {name: '--line-height-computed', type: 'line-height'},
        {name: '--headings-font-family', type: 'font-family'},
        {name: '--headings-font-weight', type: 'font-weight'},
        {name: '--headings-line-height', type: 'line-height'},
        {name: '--headings-color', type: 'color'},
        {name: '--blockquote-color', type: 'color'},
        {name: '--blockquote-font-size', type: 'font-size'},
        {name: '--blockquote-border-color', type: 'color'},
        {name: '--blockquote-small-color', type: 'color'},
      ],
    },

    {
      name: 'page-header',
      properties: [{name: '--page-header-border-color', type: 'color'}],
    },

    {
      name: 'hr',
      properties: [{name: '--hr-border', type: 'color'}],
    },

    {
      name: 'icon',
      properties: [{name: '--icon-size', type: 'size'}],
    },
  ],
}
