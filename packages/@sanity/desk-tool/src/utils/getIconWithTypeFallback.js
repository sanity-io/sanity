// Return false if we explicitly disable the icon, otherwise use the
// passed icon or the schema type icon as a backup
export default (icon, schemaType) => {
  if (icon === false) {
    return false
  }

  return icon || (schemaType && schemaType.icon)
}
