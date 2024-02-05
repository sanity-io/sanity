export function generateParagraph(length = 1000): string {
  const words = [
    'Lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua',
    'Ut',
    'enim',
    'ad',
    'minim',
    'veniam',
    'quis',
    'nostrud',
    'exercitation',
    'ullamco',
    'laboris',
    'nisi',
    'ut',
    'aliquip',
    'ex',
    'ea',
    'commodo',
    'consequat',
    'Duis',
    'aute',
    'irure',
    'dolor',
    'in',
    'reprehenderit',
    'in',
    'voluptate',
    'velit',
    'esse',
    'cillum',
    'dolore',
    'eu',
    'fugiat',
    'nulla',
    'pariatur',
    'Excepteur',
    'sint',
    'occaecat',
    'cupidatat',
    'non',
    'proident',
    'sunt',
    'in',
    'culpa',
    'qui',
    'officia',
    'deserunt',
    'mollit',
    'anim',
    'id',
    'est',
    'laborum',
  ]

  const maxWordIndex = words.length - 1
  let paragraph = ''
  let remainingLength = length

  while (remainingLength > 0) {
    const randomWord = words[Math.floor(Math.random() * maxWordIndex)]
    const wordLength = randomWord.length + 1 // add 1 for space
    if (wordLength > remainingLength) {
      break
    }
    paragraph += `${randomWord} `
    remainingLength -= wordLength
  }

  return paragraph.trim()
}

export function generateParagraphs(numParagraphs: number, paragraphLength = 1000): string {
  const paragraphs = []

  for (let i = 0; i < numParagraphs; i++) {
    paragraphs.push(generateParagraph(paragraphLength))
  }

  return paragraphs.join('/n')
}
