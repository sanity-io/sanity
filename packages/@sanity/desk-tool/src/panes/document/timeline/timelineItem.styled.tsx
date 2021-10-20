import {Text, MenuItem, Theme, Flex} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {TimelineItemState} from './types'

export interface IconWrapperProps {
  theme: Theme
}

export interface TimelineItemProps {
  state: TimelineItemState
  theme: Theme
  isHovered: boolean
}

export const StyledMenuItem = styled(MenuItem)(({theme}: {theme: Theme}) => {
  return css`
    &:not([data-selection-bottom='true'][data-selection-top='true']) {
      &[data-selection-top='true'] {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
      &[data-selection-bottom='true'] {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }
    }

    &:not([data-selection-top='true']) {
      &[data-selection-within='true'] {
        border-radius: 0;
      }
    }

    &:not([disabled], [data-selected]) {
      &[data-active='true'] {
        --card-fg-color: ${theme.sanity.color.selectable?.primary.selected.fg};
        --card-bg-color: ${theme.sanity.color.selectable?.primary.selected.bg};
        --card-muted-fg-color: ${theme.sanity.color.selectable?.primary.selected.muted.fg};
      }

      &:not([data-active='true']) {
        &[data-selection-within='true'],
        &[data-selection-top='true'],
        &[data-selection-bottom='true'] {
          --card-fg-color: ${theme.sanity.color.selectable?.primary.pressed.fg};
          --card-bg-color: ${theme.sanity.color.selectable?.primary.pressed.bg};
          --card-muted-fg-color: ${theme.sanity.color.selectable?.primary.pressed.muted.fg};
          --card-border-color: ${theme.sanity.color.selectable?.primary.pressed.border};
        }
      }

      &:not([data-active='true'], [data-selection-within='true'], [data-selection-top='true'], [data-selection-bottom='true']) {
        &[data-type='editDraft'],
        &[data-type='editLive'] {
          --card-fg-color: ${theme.sanity.color.selectable?.caution.enabled.fg};
        }

        &[data-type='unpublish'],
        &[data-type='discardDraft'],
        &[data-type='delete'] {
          --card-fg-color: ${theme.sanity.color.selectable?.critical.enabled.fg};
        }

        &[data-type='initial'],
        &[data-type='create'],
        &[data-type='withinSelection'] {
          --card-fg-color: ${theme.sanity.color.selectable?.primary.enabled.fg};
        }

        &[data-type='publish'] {
          --card-fg-color: ${theme.sanity.color.selectable?.positive.enabled.fg};
        }
      }
    }
  `
})

export const IconTimelineFlex = styled(Flex)(() => {
  const line = css`
    content: '';
    position: absolute;
    height: 6px;
    width: 1px;
    left: 50%;
    z-index: 1;
  `

  return css`
    position: relative;
    height: 40px;

    &:not([data-hidden='true']) {
      &:after {
        ${line};
        top: 0;
        background-color: var(--card-border-color);
      }

      &:before {
        ${line};
        bottom: 0;
        background-color: var(--card-border-color);
      }
    }
  `
})

export const EventLabel = styled(Text)`
  text-transform: capitalize;
`
