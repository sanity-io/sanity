import {DEFAULT_BLOCK} from '../../constants'
import {tagName} from '../helpers'

// https://gist.github.com/webtobesocial/ac9d052595b406d5a5c1

function notesEnabled(options) {
  return options.enabledBlockAnnotations.includes('note')
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
            _key: footnoteId,
            _type: 'note',
            style: 'footnote'
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
      deserialize(el, next, blocks, deserialize) {
        let footnoteId
        if (tagName(el) === 'div' && (footnoteId = getFootnoteContentElementId(el))) {
          if (!notesEnabled(options)) {
            return undefined
          }
          // Find the block where the footnote occured
          const markDef = blocks
            .map(blk => blk.markDefs.find(def => def._key === footnoteId))
            .filter(Boolean)[0]
          if (markDef) {
            el.querySelectorAll(`a[name='_${footnoteId}']`).forEach(elm => {
              elm.parentNode.removeChild(elm)
            })
            markDef.content = deserialize(el.childNodes)
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
            _key: endnoteId,
            _type: 'note',
            style: 'endnote'
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
      deserialize(el, next, blocks, deserialize) {
        let endnoteId
        if (tagName(el) === 'div' && (endnoteId = getEndnoteContentElementId(el))) {
          if (!notesEnabled(options)) {
            return undefined
          }
          // Find the block where the footnote occured
          const markDef = blocks
            .map(blk => blk.markDefs.find(def => def._key === endnoteId))
            .filter(Boolean)[0]
          if (markDef) {
            el.querySelectorAll(`a[name='_${endnoteId}']`).forEach(elm => {
              elm.parentNode.removeChild(elm)
            })
            markDef.content = deserialize(el.childNodes)
          }
          return next([])
        }
        return undefined
      }
    }
  ]
}
