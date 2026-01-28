export function stripPr(subject: string, number: number) {
  return subject.replace(new RegExp(`\\s+\\(#${number}\\)`), '')
}
