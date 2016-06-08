import processInlineStylesAndEntities from './processInlineStylesAndEntities'

let blockTagMap = {
  'header-one': `<h1>%content%</h1>\n`,
  'header-two': `<h1>%content%</h1>\n`,
  'unstyled': `<p>%content%</p>\n`,
  'code-block': `<code>%content%</code>\n`,
  'blockquote': `<blockquote>%content%</blockquote>\n`,
  'ordered-list-item': `<li>%content%</li>\n`,
  'unordered-list-item': `<li>%content%</li>\n`,
  'default': `<p>%content%</p>\n`
}

let inlineTagMap = {
  'BOLD': ['<strong>', '</strong>'],
  'ITALIC': ['<em>', '</em>'],
  'UNDERLINE': ['<u>', '</u>'],
  'CODE': ['<code>', '</code>'],
  'default': ['<span>', '</span>']
}

let entityTagMap = {
  'link': ['<a href="<%= href %>">', '</a>']
}

let nestedTagMap = {
  'ordered-list-item': ['<ol>', '</ol>'],
  'unordered-list-item': ['<ul>', '</ul>']
}

export default function (raw) {
  let html = ''
  let nestLevel = []

  raw.blocks.forEach(function (block) {

    // open tag if nested
    if (nestLevel.length > 0 && nestLevel[0] !== block.type) {
      let type = nestLevel.shift()
      html += nestedTagMap[type][1]
    }

    // close tag is note consecutive same nested
    if (nestedTagMap[block.type] && nestLevel[0] !== block.type) {
      html += nestedTagMap[block.type][0]
      nestLevel.unshift(block.type)
    }

    html += blockTagMap[block.type] ?
      blockTagMap[block.type].replace(
        '%content%',
        processInlineStylesAndEntities(inlineTagMap, entityTagMap, raw.entityMap, block)
      ) :
      blockTagMap['default'].replace(
        '%content%',
        processInlineStylesAndEntities(inlineTagMap, block)
      )
  })
  return html

}
