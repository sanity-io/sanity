export function stripPr(subject: string, number?: number) {
  return typeof number === 'number'
    ? subject.replace(new RegExp(`\\s+\\(#${number}\\)`), '')
    : subject
}
