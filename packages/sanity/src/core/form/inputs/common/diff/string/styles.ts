import {css, type RuleSet} from 'styled-components'

import {Segment} from './segments'

export function stringDiffContainerStyles(): RuleSet {
  return css`
    del${Segment} {
      opacity: 0.5;
      text-decoration: line-through;

      &::before {
        text-decoration: line-through;
        content: attr(data-text);
      }
    }

    ins${Segment} {
      text-decoration: none;
    }
  `
}
