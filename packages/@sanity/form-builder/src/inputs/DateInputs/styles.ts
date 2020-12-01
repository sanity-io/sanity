import styled from 'styled-components'
import {Card} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'

export const Root = styled(Card)`
  border: ${legacyTheme['--input-border-size']} solid ${legacyTheme['--input-border-color']};
  outline: none;
  border-radius: ${legacyTheme['--input-border-radius']};
  color: ${legacyTheme['--input-color']};
  background-color: ${legacyTheme['--card-bg-color']};
  box-shadow: ${legacyTheme['--input-box-shadow']};
  display: flex;
  padding: 0;
  position: relative;
  overflow: hidden;

  & > div {
    flex-grow: 1;
  }

  &:hover {
    box-shadow: ${legacyTheme['--input-box-shadow--hover']};
    border-color: ${legacyTheme['--input-border-color-hover']};
  }

  &:active {
    border-color: ${legacyTheme['--input-border-color-active']};
  }

  &:focus,
  &:focus-within {
    box-shadow: ${legacyTheme['--input-box-shadow-thin--focus']};
    background-color: ${legacyTheme['--input-bg-focus']};
    border-color: ${legacyTheme['--input-border-color-focus']};

    &:invalid {
      box-shadow: ${legacyTheme['--input-box-shadow--invalid-focus']};
    }
  }

  &:not(:focus):not(:focus-within):invalid {
    border-color: ${legacyTheme['--input-border-color-invalid']};
  }

  &:invalid {
    background-color: ${legacyTheme['--input-bg-invalid']};
    box-shadow: ${legacyTheme['--input-box-shadow--invalid']};
  }

  & .react-datepicker-wrapper {
    position: relative;
    display: block;
    width: 100%;
  }

  & .react-datepicker__input-container {
    width: 100%;
    display: block;
  }

  & .react-datepicker-popper {
    background-color: transparent;

    &[data-placement^='bottom'] .react-datepicker__triangle {
      border-bottom-color: ${legacyTheme['--main-navigation-color']} !important;

      &::before {
        display: none;
      }
    }
  }

  & .rootInvalid {
    border-color: ${legacyTheme['--input-border-color-invalid']};
    background-color: ${legacyTheme['--input-bg-invalid']};
    box-shadow: ${legacyTheme['--input-box-shadow--invalid']};

    &:focus,
    &:focus-within {
      box-shadow: ${legacyTheme['--input-box-shadow--invalid-focus']} !important;
    }
  }

  & .buttonWrapper {
    margin: -1px -1px -1px 0;
  }

  & .react-datepicker-input {
    -webkit-font-smoothing: inherit;
    appearance: none;
    font: inherit;
    line-height: ${legacyTheme['--input-line-height']};
    box-sizing: border-box;
    padding: calc(
        ${legacyTheme['--input-padding-horizontal']} - ${legacyTheme['--input-border-size']} - 4px
      )
      calc(${legacyTheme['--input-padding-vertical']} - ${legacyTheme['--input-border-size']})
      calc(
        ${legacyTheme['--input-padding-horizontal']} - ${legacyTheme['--input-border-size']} - 3px
      );
    width: 100%;
    border: none;
    outline: none;
    background-color: inherit;
    color: inherit;

    &::placeholder {
      color: ${legacyTheme['--input-color-placeholder']};
    }

    &:disabled {
      color: ${legacyTheme['--input-color-disabled']};
    }
  }
`

export const Portal = styled.div`
  background-color: ${legacyTheme['--backdrop-color']};

  z-index: ${legacyTheme['--zindex-portal']};
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;

  & .react-datepicker-calendar {
    box-shadow: 0 0 0 1px ${legacyTheme['--hairline-color']},
      0 8px 17px 2px ${legacyTheme['--shadow-color-umbra']},
      0 3px 14px 2px ${legacyTheme['--shadow-color-penumbra']},
      0 5px 5px -3px ${legacyTheme['--shadow-color-ambient']};

    font-family: ${legacyTheme['--font-family-base']};
    border: 0;

    & .react-datepicker__current-month {
      display: none;
    }

    & .react-datepicker__header {
      background-color: transparent;
      color: ${legacyTheme['--main-navigation-color']};
      border: 0;
      border-top-right-radius: 0 !important;
    }

    & .react-datepicker__navigation {
      border: 1px solid ${legacyTheme['--gray']};
      transform: rotate(45deg);
      height: 8px;
      width: 8px;
      margin-top: 8px;
    }

    & .react-datepicker__navigation--previous {
      border-width: 0 0 1px 1px;
      margin-left: 4px;
    }

    & .react-datepicker__navigation--next {
      border-width: 1px 1px 0 0;
      margin-right: 4px;
    }

    & .react-datepicker__month-select {
      font-weight: 600;
    }

    & .react-datepicker__year-select {
      font-weight: 600;
    }

    & .react-datepicker__day-names {
      border-bottom: 1px solid ${legacyTheme['--hairline-color']};
      font-weight: 600;
    }

    & .react-datepicker__day--selected {
      border-radius: 50%;
    }

    & .react-datepicker__day--keyboard-selected {
      border-radius: 50%;
      background: ${legacyTheme['--brand-primary']};
    }

    & .react-datepicker__day:hover {
      border-radius: 50%;
    }

    & .react-datepicker__today-button {
      background: transparent;
      border-top: 1px solid ${legacyTheme['--hairline-color']};
    }

    & .react-datepicker-time__header {
      color: ${legacyTheme['--main-navigation-color']};
      background: transparent;
      font-size: 0.8rem;
    }

    & .react-datepicker__time-container {
      border-color: ${legacyTheme['--gray-lighter']};
      border-radius: 6px;
      overflow: hidden;
    }

    & .react-datepicker__time-list-item--selected {
      background: ${legacyTheme['--brand-primary']} !important;
    }

    & .react-datepicker__header--time,
    & .react-datepicker__time-container {
      background-color: ${legacyTheme['--main-navigation-color--inverted']};
    }

    & .react-datepicker__header--time {
      border-bottom: 1px solid ${legacyTheme['--hairline-color']};
      background: transparent;
    }

    & .react-datepicker__day-name {
      color: ${legacyTheme['--main-navigation-color']};
    }

    & .react-datepicker__day--selected {
      background-color: ${legacyTheme['--selected-item-color']};
      color: ${legacyTheme['--selected-item-color--inverted']};
    }

    & li.react-datepicker__time-list-item {
      height: 2em !important;
      line-height: 2em !important;
    }

    & .react-datepicker__month-dropdown-container,
    & .react-datepicker__year-dropdown-container {
      position: relative;

      &::before {
        z-index: 2;
        content: '';
        position: absolute;
        height: 2em;
        width: 2em;
        top: 2px;
        right: 2px;
        color: ${legacyTheme['--input-color']};
        background-color: ${legacyTheme['--input-bg']};
        transform: scale(0.8);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z' fill='currentColor' /%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3C/svg%3E");
        pointer-events: none;
      }
    }

    & .react-datepicker__month-select,
    & .react-datepicker__year-select {
      position: relative;
      appearance: none;
      padding: 0.5em;
      padding-right: 2.5em;
      border: ${legacyTheme['--input-border-size']} solid ${legacyTheme['--input-border-color']};
      display: block;
      outline: none;
      font-size: inherit;
      box-sizing: border-box;
      border-radius: ${legacyTheme['--input-border-radius']};
      color: ${legacyTheme['--input-color']};
      background-color: ${legacyTheme['--input-bg']};

      &:hover {
        border-color: ${legacyTheme['--input-border-color-hover']};
      }

      &:focus {
        border-color: ${legacyTheme['--input-border-color-focus']};
      }
    }
  }
`
