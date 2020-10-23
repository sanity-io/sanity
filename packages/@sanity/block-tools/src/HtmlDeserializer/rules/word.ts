import {DEFAULT_BLOCK, BLOCK_DEFAULT_STYLE} from '../../constants'
import {tagName} from '../helpers'

function getListItemStyle(el) {
  let style
  if ((style = el.getAttribute('style'))) {
    if (!style.match(/lfo\d+/)) {
      return undefined
    }
    return style.match('lfo1') ? 'bullet' : 'number'
  }
  return undefined
}

function getListItemLevel(el) {
  let style
  if ((style = el.getAttribute('style'))) {
    const levelMatch = style.match(/level\d+/)
    if (!levelMatch) {
      return undefined
    }
    const level = levelMatch[0].match(/\d/)[0]
    return parseInt(level, 10) || 1
  }
  return undefined
}

function isWordListElement(el) {
  if (el.className) {
    return (
      el.className === 'MsoListParagraphCxSpFirst' ||
      el.className === 'MsoListParagraphCxSpMiddle' ||
      el.className === 'MsoListParagraphCxSpLast'
    )
  }
  return undefined
}

export default function createWordRules(blockContentType, options = {}) {
  return [
    {
      deserialize(el, next) {
        if (tagName(el) === 'p' && isWordListElement(el)) {
          return {
            ...DEFAULT_BLOCK,
            listItem: getListItemStyle(el),
            level: getListItemLevel(el),
            style: BLOCK_DEFAULT_STYLE,
            children: next(el.childNodes),
          }
        }
        return undefined
      },
    },
  ]
}
