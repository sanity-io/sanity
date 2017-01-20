export function preventDefault(event) {
  event.preventDefault()
}

export function parseParams(pathname) {
  const [schemaName, typeName] = pathname.split('/').filter(Boolean)
  return {schemaName, typeName}
}
