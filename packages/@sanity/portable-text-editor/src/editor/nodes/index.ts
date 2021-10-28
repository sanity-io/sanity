import styled from 'styled-components'

export const DefaultBlockObject = styled.div`
  user-select: none;
  border: ${(props: {selected: boolean}) => {
    if (props.selected) {
      return '1px solid blue'
    }
    return '1px solid transparent'
  }};
`

export const DefaultInlineObject = styled.span`
  background: #999;
  border: ${(props: {selected: boolean}) => {
    if (props.selected) {
      return '1px solid blue'
    }
    return '1px solid transparent'
  }};
`

type ListItemProps = {listLevel: number; listStyle: string}

export const DefaultListItem = styled.div<ListItemProps>`
  &.pt-list-item {
    width: fit-content;
    position: relative;
    display: block;

    /* Important 'transform' in order to force refresh the ::before and ::after rules
      in Webkit: https://stackoverflow.com/a/21947628/831480
    */
    transform: translateZ(0);
    margin-left: ${(props: ListItemProps) => getLeftPositionForListLevel(props.listLevel)};
  }
  &.pt-list-item > .pt-list-item-inner {
    display: flex;
    margin: 0;
    padding: 0;
    &:before {
      justify-content: flex-start;
      vertical-align: top;
    }
  }
  &.pt-list-item-bullet > .pt-list-item-inner:before {
      content: '${(props: ListItemProps) =>
        getContentForListLevelAndStyle(props.listLevel, props.listStyle)}';
      font-size: 0.4375rem; /* 7px */
      line-height: 1.5rem; /* Same as body text */
      /* Optical alignment */
      position: relative;
    }
  }
  &.pt-list-item-bullet > .pt-list-item-inner {
    &:before {
      min-width: 1.5rem; /* Make sure space between bullet and text never shrinks */
    }
  }
  &.pt-list-item-number {
    counter-increment: ${(props: {listLevel: number}) =>
      getCounterIncrementForListLevel(props.listLevel)};
    counter-reset: ${(props: {listLevel: number}) => getCounterResetForListLevel(props.listLevel)};
  }
  & + :not(.pt-list-item-number) {
    counter-reset: listItemNumber;
  }
  &.pt-list-item-number > .pt-list-item-inner:before {
    content: ${(props) => getCounterContentForListLevel(props.listLevel)};
    min-width: 1.5rem; /* Make sure space between number and text never shrinks */
    /* Optical alignment */
    position: relative;
    top: 1px;
  }
`

export const DefaultListItemInner = styled.div``

function getLeftPositionForListLevel(level: number) {
  switch (Number(level)) {
    case 1:
      return '1.5em'
    case 2:
      return '3em'
    case 3:
      return '4.5em'
    case 4:
      return '6em'
    case 5:
      return '7.5em'
    case 6:
      return '9em'
    case 7:
      return '10.5em'
    case 8:
      return '12em'
    case 9:
      return '13.5em'
    case 10:
      return '15em'
    default:
      return '0em'
  }
}

const bullets = ['●', '○', '■']

function getContentForListLevelAndStyle(level: number, style: string) {
  const normalizedLevel = (level - 1) % 3
  if (style === 'bullet') {
    return bullets[normalizedLevel]
  }
  return '*'
}

function getCounterIncrementForListLevel(level: number) {
  switch (level) {
    case 1:
      return 'listItemNumber'
    case 2:
      return 'listItemAlpha'
    case 3:
      return 'listItemRoman'
    case 4:
      return 'listItemNumberNext'
    case 5:
      return 'listItemLetterNext'
    case 6:
      return 'listItemRomanNext'
    case 7:
      return 'listItemNumberNextNext'
    case 8:
      return 'listItemAlphaNextNext'
    case 9:
      return 'listItemRomanNextNext'
    default:
      return 'listItemNumberNextNextNext'
  }
}

function getCounterResetForListLevel(level: number) {
  switch (level) {
    case 1:
      return 'listItemAlpha'
    case 2:
      return 'listItemRoman'
    case 3:
      return 'listItemNumberNext'
    case 4:
      return 'listItemLetterNext'
    case 5:
      return 'listItemRomanNext'
    case 6:
      return 'listItemNumberNextNext'
    case 7:
      return 'listItemAlphaNextNext'
    case 8:
      return 'listItemRomanNextNext'
    case 9:
      return 'listItemNumberNextNextNext'
    default:
      return 'listItemNumberNextNextNext'
  }
}

function getCounterContentForListLevel(level: number) {
  switch (level) {
    case 1:
      return `counter(listItemNumber) '. '`
    case 2:
      return `counter(listItemAlpha, lower-alpha) '. '`
    case 3:
      return `counter(listItemRoman, lower-roman) '. '`
    case 4:
      return `counter(listItemNumberNext) '. '`
    case 5:
      return `counter(listItemLetterNext, lower-alpha) '. '`
    case 6:
      return `counter(listItemRomanNext, lower-roman) '. '`
    case 7:
      return `counter(listItemNumberNextNext) '. '`
    case 8:
      return `counter(listItemAlphaNextNext, lower-alpha) '. '`
    case 9:
      return `counter(listItemRomanNextNext, lower-roman) '. '`
    default:
      return `counter(listItemNumberNextNextNext) '. '`
  }
}
