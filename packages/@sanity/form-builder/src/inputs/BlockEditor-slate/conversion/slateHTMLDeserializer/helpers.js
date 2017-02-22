export function isPastedFromGoogleDocs(el) {
  return el.attribs
    && el.attribs.id
    && el.attribs.id.match(/^docs-internal-guid-/)
}

export function resolveListItem(listNodeTagName) {
  let listStyle
  switch (listNodeTagName) {
    case 'ul':
      listStyle = 'bullet'
      break
    case 'ol':
      listStyle = 'number'
      break
    default:
      listStyle = 'bullet'
  }
  return listStyle
}

