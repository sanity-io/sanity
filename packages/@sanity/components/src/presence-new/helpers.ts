export function nameToInitials(fullName: string) {
  const namesArray = fullName.split(' ')
  if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
}

export function shortenName(fullName: string) {
  const length = fullName.split('').length
  if (length > 18) {
    const nameArray = fullName.split(' ')
    return `${nameArray[0]} ${nameArray[nameArray.length - 1].charAt(0)}.`
  }
  return fullName
}