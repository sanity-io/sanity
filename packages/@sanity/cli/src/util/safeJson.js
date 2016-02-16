export default (json, theDefault) => {
  try {
    return JSON.parse(json)
  } catch (err) {
    return theDefault
  }
}
