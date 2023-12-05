export const replaceContent = (
  message: string,
  value: {
    [key: string]: string | number
  },
): string => {
  if (!value) return message
  if (!message) return ''
  return message?.replace(/{{.*?}}/g, (match) => {
    const cleanedMatch = match?.replace(/({{)|(}})/g, '').trim()
    const matchValue = value[cleanedMatch]
    return String(matchValue) || match
  })
}
