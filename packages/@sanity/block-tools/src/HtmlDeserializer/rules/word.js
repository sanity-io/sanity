import randomKey from '../../util/randomKey'
import {DEFAULT_BLOCK} from '../../constants'
import {tagName} from '../helpers'

// https://gist.github.com/webtobesocial/ac9d052595b406d5a5c1

function notesEnabled(options) {
  return options.enabledBlockAnnotations.includes('blockNote')
}

function isNormalEmptyParagraph(el) {
  return tagName(el) === 'p'
    && el.textContent === ''
    && el.textContent === ''
    && el.className === 'MsoNormal'
}

function getListItemStyle(el) {
  const symbol = el.textContent.trim()
  if (symbol.match(/\b\./)) {
    return 'number'
  }
  return 'bullet'
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

function isListElement(el) {
  if (el.className) {
    return el.className === 'MsoListParagraphCxSpFirst'
      || el.className === 'MsoListParagraphCxSpMiddle'
      || el.className === 'MsoListParagraphCxSpLast'
  }
  return undefined
}

function getFootnoteContentElementId(el) {
  const style = el.getAttribute('style')
  if (style && style === 'mso-element:footnote') {
    return el.getAttribute('id').trim()
  }
  return null
}

function getFootnoteLinkElementId(el) {
  const style = el.getAttribute('style')
  if (style && style.match(/mso-footnote-id/)) {
    return style.split(':')[1].trim()
  }
  return null
}

function getEndnoteContentElementId(el) {
  const style = el.getAttribute('style')
  if (style && style === 'mso-element:endnote') {
    return el.getAttribute('id').trim()
  }
  return null
}

function getEndnoteLinkElementId(el) {
  const style = el.getAttribute('style')
  if (style && style.match(/mso-endnote-id/)) {
    return style.split(':')[1].trim()
  }
  return null
}

export default function createWordRules(blockContentType, options = {}) {

  return [
    // Fix weird paragraphing within Word (paragraph is more of a line break)
    // If we see two empty paragraphs after each other, we return an empty block
    {
      deserialize(el, next) {
        if (isNormalEmptyParagraph(el)) {
          const nextSibling = el.nextElementSibling
          if (nextSibling && isNormalEmptyParagraph(nextSibling)) {
            return {
              ...DEFAULT_BLOCK,
              style: 'normal',
              children: [{_type: 'span', marks: [], text: ''}]
            }
          }
          return next([])
        }
        return undefined
      }
    },
    // List elements
    {
      deserialize(el, next) {
        if (tagName(el) === 'p' && isListElement(el)) {
          const listItem = el.querySelector("span[style='mso-list:Ignore']")
          const listItemStyle = getListItemStyle(listItem)
          listItem.parentNode.removeChild(listItem)
          return {
            ...DEFAULT_BLOCK,
            listItem: listItemStyle,
            level: getListItemLevel(el),
            style: 'normal',
            children: next(el.childNodes)
          }
        }
        return undefined
      }
    },
    // Fotnote links
    {
      deserialize(el, next) {
        let footnoteId
        if (tagName(el) === 'a' && (footnoteId = getFootnoteLinkElementId(el))) {
          if (!notesEnabled(options)) {
            return undefined
          }
          const markDef = {
            _key: randomKey(12),
            _type: 'blockNote',
            style: 'footnote',
            blockNoteId: footnoteId
          }
          return {
            _type: '__annotation',
            markDef: markDef,
            children: next(el.childNodes)
          }

        }
        return undefined
      }
    },
    // Footnote content
    {
      deserialize(el, next, {blocks, deserialize}) {
        let footnoteId
        if (tagName(el) === 'div' && (footnoteId = getFootnoteContentElementId(el))) {
          if (!notesEnabled(options)) {
            return undefined
          }
          // Find the block where the footnote occured
          const markDef = blocks
            .map(blk => blk.markDefs.find(def => def.blockNoteId === footnoteId))
            .filter(Boolean)[0]
          if (markDef) {
            el.querySelectorAll(`a[name='_${footnoteId}']`).forEach(elm => {
              elm.parentNode.removeChild(elm)
            })
            markDef.content = deserialize(el.childNodes)
            delete markDef.blockNoteId
          }
          return next([])
        }
        return undefined
      }
    },
    // Endnote links
    {
      deserialize(el, next) {
        let endnoteId
        if (tagName(el) === 'a' && (endnoteId = getEndnoteLinkElementId(el))) {
          if (!notesEnabled(options)) {
            return undefined
          }
          const markDef = {
            _key: randomKey(12),
            _type: 'blockNote',
            style: 'endnote',
            blockNoteId: endnoteId
          }
          return {
            _type: '__annotation',
            markDef: markDef,
            children: next(el.childNodes)
          }

        }
        return undefined
      }
    },
    // Endnote content
    {
      deserialize(el, next, {blocks, deserialize}) {
        let endnoteId
        if (tagName(el) === 'div' && (endnoteId = getEndnoteContentElementId(el))) {
          if (!notesEnabled(options)) {
            return undefined
          }
          // Find the block where the footnote occured
          const markDef = blocks
            .map(blk => blk.markDefs.find(def => def.blockNoteId === endnoteId))
            .filter(Boolean)[0]
          if (markDef) {
            el.querySelectorAll(`a[name='_${endnoteId}']`).forEach(elm => {
              elm.parentNode.removeChild(elm)
            })
            markDef.content = deserialize(el.childNodes)
            delete markDef.blockNoteId
          }
          return next([])
        }
        return undefined
      }
    }
  ]
}
