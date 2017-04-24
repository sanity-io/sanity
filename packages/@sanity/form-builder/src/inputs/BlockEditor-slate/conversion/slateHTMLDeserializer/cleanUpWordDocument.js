const unwantedTags = [
  'o:p',
  'xml',
  'script',
  'meta',
  'link'
]

function isUnwanted(index, node) {
  return unwantedTags.includes(node.tag)
}

function findListTypeAndContent(element) {
  const newElement = element.clone()
  const typeData = newElement.find('span[style$=Ignore]').remove()
  const numberTest = typeData.text().trim().replace('.', '')
  let type = 'bullet'
  if (parseInt(numberTest, 10)) {
    type = 'number'
  }
  return {element: newElement, type: type}
}

function addListItem(doc, listContainer) {
  return function () {
    const nextListItem = doc('<li></li>')
    const nextListItemContent = findListTypeAndContent(doc(this))
    listContainer.append(nextListItem.append(nextListItemContent.element))
    doc(this).remove()
  }
}

export default function cleanUpWordDocument(doc) {
  doc.root()
    .find('*')
    .contents()
    .filter(isUnwanted)
    .remove()

  // Check if there are any lists, and convert them to html
  const listFirstElements = doc('p.MsoListParagraphCxSpFirst')
  if (listFirstElements.length) {
    const unOrderedList = '<ul></ul>'
    const orderedList = '<ol></ol>'
    doc('p.MsoListParagraphCxSpFirst').each(function () {
      const element = doc(this)
      const listIitemContent = findListTypeAndContent(element)
      const listContainer = doc(listIitemContent.type === 'number' ? orderedList : unOrderedList)
      const listItem = doc('<li></li>')
      listItem.append(listIitemContent.element)
      listContainer.append(listItem)
      element.nextUntil('p.MsoListParagraphCxSpLast').each(addListItem(doc, listContainer))
      element.next('p.MsoListParagraphCxSpLast').each(addListItem(doc, listContainer))
      element.replaceWith(listContainer)
    })
  }

  return doc
}
