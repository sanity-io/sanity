import {css} from 'styled-components'

export const legacyVariables = css`
  --black: #121923;
  --white: #fff;
  --brand-darkest: var(--black);
  --brand-darkest--inverted: color(var(--brand-darkest) contrast(80%));
  --brand-lightest: var(--white);
  --brand-primary: #2276fc;
  --brand-primary--inverted: color(var(--brand-primary) contrast(80%));
  --brand-secondary: #f03e2f;
  --brand-secondary--inverted: var(--brand-lightest);

  /* Base */
  --brand-faded: color(var(--brand-primary) blend(var(--white) 60%));
  --gray-base: color(var(--black) blend(var(--brand-faded) 50%));

  /* Shades */
  --gray-darkest: color(var(--black) blend(var(--gray-base) 20%));
  --gray-darker: color(var(--black) blend(var(--gray-base) 50%));
  --gray-dark: color(var(--black) blend(var(--gray-base) 70%));
  --gray: var(--gray-base);
  --gray-light: color(var(--white) blend(var(--gray-base) 70%));
  --gray-lighter: color(var(--white) blend(var(--gray-base) 50%));
  --gray-lightest: color(var(--white) blend(var(--gray-base) 20%));

  /* Deprecated: */
  --gray-darkest--transparent: color(var(--black) alpha(95%));
  --gray-darker-transparent: color(var(--black) alpha(80%));
  --gray-dark--transparent: color(var(--black) alpha(65%));
  --gray--transparent: color(var(--black) alpha(50%));
  --gray-light--transparent: color(var(--black) alpha(35%));
  --gray-lighter--transparent: color(var(--black) alpha(20%));
  --gray-lightest--transparent: color(var(--black) alpha(5%));

  /* Focus */
  --focus-color: var(--brand-primary);

  /* Input */
  --input-bg: var(--component-bg);
  --input-bg-focus: var(--input-bg);
  --input-bg-invalid: var(--component-bg);
  --input-bg-disabled: color(var(--gray-lightest) blend(var(--white) 75%));
  --input-color: var(--text-color);
  --input-color-disabled: var(--gray);
  --input-color-read-only: var(--gray-darker);
  --input-border-color: var(--gray-lighter);
  --input-border-size: 1px;
  --input-line-height: var(--line-height-base);
  --input-padding-vertical: calc(var(--medium-padding) - var(--extra-small-padding));
  --input-padding-horizontal: calc(var(--medium-padding) - var(--extra-small-padding));
  --input-border-radius: var(--border-radius-small);
  --input-border-radius-large: var(--border-radius-large);
  --input-border-radius-small: var(--border-radius-small);
  --input-border-color-hover: var(--gray-light);
  --input-border-color-focus: var(--focus-color);
  --input-border-color-active: var(--focus-color);
  --input-border-color-invalid: color(var(--state-danger-color) a(50%));
  --input-color-placeholder: var(--gray-lighter);
  --input-box-shadow-base: var(--gray);
  --input-box-shadow: none;
  --input-box-shadow--hover: none;
  --input-box-shadow--focus: 0 0 0 2px var(--focus-color);
  --input-box-shadow-thin--focus: 0 0 0 1px var(--focus-color);
  --input-box-shadow--invalid: none;
  --input-box-shadow--invalid-focus: 0 0 0 1px var(--focus-color);

  /* Body */
  --body-bg: var(--gray-lightest);
  --body-text: var(--gray-darkest);

  /* Preview */
  --preview-placeholder-color: var(--gray-lightest);

  /* Backdrop */
  --backdrop-color: color(var(--gray) alpha(15%));

  /* Main navigation */
  --main-navigation-color: var(--gray-darkest);
  --main-navigation-color--inverted: color(var(--main-navigation-color) contrast(80%));
  --main-navigation-color--inverted-muted: color(
    var(--main-navigation-color) blend(var(--main-navigation-color--inverted) 70%)
  );

  /* Dialog */
  --dialog-header-color: var(--component-bg);
  --dialog-header-color--inverted: var(--body-text);

  /* Header */
  /* @todo: add comment about WHICH header it refers to */
  --header-height: 3.0625rem;

  /* Checkerboard */
  --checkerboard-color: color(var(--gray) alpha(10%));

  /* Hairline */
  --hairline-color: color(var(--gray-base) alpha(25%));

  /* Component */
  --component-bg: var(--white);
  --component-text-color: var(--gray-darkest);
  --component-border-color: var(--hairline-color);

  /* Button */
  --button-border-radius: var(--border-radius-medium);

  /* "Default" button */
  --default-button-color: var(--gray);
  --default-button-color--inverted: var(--white);
  --default-button-color--hover: var(--gray); /* not in use */
  --default-button-color--active: var(--gray); /* not in use */
  --default-button-primary-color: var(--brand-primary);
  --default-button-primary-color--inverted: var(--brand-primary--inverted);
  --default-button-success-color: var(--state-success-color);
  --default-button-success-color--inverted: var(--state-success-color--inverted);
  --default-button-warning-color: var(--state-warning-color);
  --default-button-warning-color--inverted: var(--state-warning-color--inverted);
  --default-button-danger-color: var(--state-danger-color);
  --default-button-danger-color--inverted: var(--state-danger-color--inverted);

  /* Shadows */
  --shadow-base: var(--gray-darkest);
  --shadow-color-umbra: color(var(--shadow-base) alpha(10%));
  --shadow-color-penumbra: color(var(--shadow-base) alpha(8%));
  --shadow-color-ambient: color(var(--shadow-base) alpha(2%));

  /* Border radius */
  --border-radius-base: 4px;
  --border-radius-large: calc(var(--border-radius-base) * 1.5);
  --border-radius-medium: var(--border-radius-base);
  --border-radius-small: calc(var(--border-radius-base) / 2);

  /* Padding */
  --extra-small-padding: 0.25rem;
  --extra-small-padding--em: 0.25em;
  --small-padding: 0.5rem;
  --small-padding--em: 0.5em;
  --medium-padding: 1rem;
  --medium-padding--em: 1em;
  --large-padding: 1.5rem;
  --large-padding--em: 1.5em;
  --extra-large-padding: 2rem;
  --extra-large-padding--em: 2em;

  /* Text selection */
  --text-selection-color: color(var(--brand-primary) alpha(20%));

  /* Block editor */
  --block-editor-base-font-family: inherit;
  --block-editor-header-font-family: inherit;
  --block-extras-width: 2rem;
  --block-extras-border-color: var(--hairline-color);
  --block-extras-background-color: color(var(--gray-lightest) alpha(50%));

  /* Timeline event */
  --timeline-event-enabled-bg: var(--component-bg);
  --timeline-event-enabled-fg: var(--text-muted);
  --timeline-event-enabled-border: color(var(--timeline-event-enabled-bg) blend(var(--gray) 30%));
  --timeline-event-enabled-hover-bg: var(--selectable-item-color-hover);
  --timeline-event-enabled-hover-fg: var(--text-color-secondary);
  --timeline-event-enabled-icon-created-bg: var(--brand-primary);
  --timeline-event-enabled-icon-created-fg: var(--component-bg);
  --timeline-event-enabled-icon-deleted-bg: var(--state-danger-color);
  --timeline-event-enabled-icon-deleted-fg: var(--component-bg);
  --timeline-event-enabled-icon-discarded-draft-bg: var(--state-danger-color);
  --timeline-event-enabled-icon-discarded-draft-fg: var(--component-bg);
  --timeline-event-enabled-icon-edited-bg: color(
    var(--component-bg) blend(var(--state-warning-color) 10%)
  );
  --timeline-event-enabled-icon-edited-fg: var(--state-warning-color);
  --timeline-event-enabled-icon-published-bg: var(--state-success-color);
  --timeline-event-enabled-icon-published-fg: var(--component-bg);
  --timeline-event-enabled-icon-unpublished-bg: var(--state-danger-color);
  --timeline-event-enabled-icon-unpublished-fg: var(--component-bg);
  --timeline-event-within-selection-bg: color(
    var(--component-bg) blend(var(--selectable-item-base) 10%)
  );
  --timeline-event-within-selection-fg: var(--selectable-item-base);
  --timeline-event-within-selection-border: var(--selectable-item-base);
  --timeline-event-within-selection-icon-bg: var(--component-bg);
  --timeline-event-within-selection-icon-fg: var(--selectable-item-base);
  --timeline-event-selected-bg: var(--selectable-item-base);
  --timeline-event-selected-fg: var(--component-bg);
  --timeline-event-selected-border: var(--component-bg);
  --timeline-event-selected-icon-bg: var(--component-bg);
  --timeline-event-selected-icon-fg: var(--selectable-item-base);
  --timeline-event-disabled-bg: var(--component-bg);
  --timeline-event-disabled-fg: color(var(--component-bg) blend(var(--gray) 50%));
  --timeline-event-disabled-icon-bg: color(var(--component-bg) blend(var(--gray) 30%));
  --timeline-event-disabled-icon-fg: var(--component-bg);

  /* Others */
  --pane-header-height: 3.4375rem; /* 55px */
  --avatar-height: 23px;

  /* Label */
  --label-color: var(--text-color);

  /* Legend */
  --legend-color: var(--text-color);

  /* Cursor */
  --cursor-disabled: not-allowed;

  /* Clear cross */
  --clear-cross-color: var(--input-color);
  --clear-cross-color-hover: var(--state-danger-color);

  /* fieldset */
  --fieldset-border: var(--input-border-size) solid var(--hairline-color);
  --fieldset-box-shadow: none;
  --fieldset-box-shadow--hover: none;
  --fieldset-box-shadow--invalid: none;
  --fieldset-box-shadow--focus: var(--input-box-shadow--focus);
  --fieldset-box-shadow--invalid-focus: var(--input-box-shadow--invalid-focus);
  --fieldset-bg: transparent;

  /* Form builder */
  --form-builder-block-border-color: var(--component-border-color);
  --form-builder-block-border-color--hover: var(--gray-light);
  --form-builder-block-border-color-focus: var(--input-border-color-focus);
  --form-builder-block-border-color-error: var(--input-border-color-invalid);
  --form-builder-block-background: color(var(--gray-lightest) alpha(50%));
  --form-builder-block-background-hover: transparent;
  --form-builder-block-background-selected: var(--text-selection-color);
  --form-builder-block-shadow--focus: var(--input-box-shadow--focus);

  /* deprecated: */
  --form-builder-block-shadow: var(--input-box-shadow);
  --form-builder-block-shadow--hover: var(--input-box-shadow--hover);
  --form-builder-block-shadow--invalid: var(--input-box-shadow--invalid);
  --form-builder-block-shadow--invalid-focus: var(--input-box-shadow--invalid-focus);
  --form-builder-block-border-radius: var(--border-radius-small);
`
