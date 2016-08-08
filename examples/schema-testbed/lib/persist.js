
export function restore(key) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : undefined
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error reading from local storage: ', error)
  }
  return undefined
}

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
