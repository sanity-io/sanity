export default function handlePaste(input) {
  const {event, path} = input
  const jsonData = event.clipboardData.getData('application/json')
  if (jsonData) {
    const data = JSON.parse(jsonData)
    return {insert: data, path}
  }
  return undefined
}
