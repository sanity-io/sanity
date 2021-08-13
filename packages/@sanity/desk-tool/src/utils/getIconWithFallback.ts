// Return false if we explicitly disable the icon, otherwise use the
// passed icon or the schema type icon as a backup
export default (icon, schemaType, defaultIcon) => {
  if (icon === false) {
    return false
  }

  return icon || (schemaType && schemaType.icon) || defaultIcon
}
