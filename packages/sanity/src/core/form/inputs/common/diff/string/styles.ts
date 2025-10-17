import {css, type RuleSet} from 'styled-components'

export function stringDiffContainerStyles(): RuleSet {
  return css`
    del {
      opacity: 0.5;
      text-decoration: line-through;

      &::before {
        text-decoration: line-through;
        content: attr(data-text);
      }
    }

    ins {
      text-decoration: none;
    }
  `
}
