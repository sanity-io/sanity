import type {DeserializerRule} from '../../types'
import {DEFAULT_BLOCK, BLOCK_DEFAULT_STYLE} from '../../constants'
import {isElement, tagName} from '../helpers'

function getListItemStyle(el: Node): string | undefined {
  const style = isElement(el) && el.getAttribute('style')
  if (!style) {
    return undefined
  }

  if (!style.match(/lfo\d+/)) {
    return undefined
  }

  return style.match('lfo1') ? 'bullet' : 'number'
}

function getListItemLevel(el: Node): number | undefined {
  const style = isElement(el) && el.getAttribute('style')
  if (!style) {
    return undefined
  }

  const levelMatch = style.match(/level\d+/)
  if (!levelMatch) {
    return undefined
  }

  const [level] = levelMatch[0].match(/\d/) || []
  const levelNum = level ? parseInt(level, 10) : 1
  return levelNum || 1
}

function isWordListElement(el: Node): boolean {
  return isElement(el) && el.className
    ? el.className === 'MsoListParagraphCxSpFirst' ||
        el.className === 'MsoListParagraphCxSpMiddle' ||
        el.className === 'MsoListParagraphCxSpLast'
    : false
}

export default function createWordRules(): DeserializerRule[] {
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
