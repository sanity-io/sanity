export default function groq(strings: TemplateStringsArray, ...keys: any[]): string {
  const lastIndex = strings.length - 1
  return (
    strings.slice(0, lastIndex).reduce((acc, str, i) => {
      return acc + str + keys[i]
    }, '') + strings[lastIndex]
  )
}
