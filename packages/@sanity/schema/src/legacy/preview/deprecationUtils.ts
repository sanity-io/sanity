export function warnIfPreviewOnOptions(type: any) {
  if (type.options && type.options.preview) {
    // eslint-disable-next-line no-console
    console.warn(`Heads up! The preview config is no longer defined on "options", but instead on the type/field itself.
Please move {options: {preview: ...}} to {..., preview: ...} on the type/field definition of "${type.name}".
`)
  }
}

export function warnIfPreviewHasFields(type: any) {
  const preview = type.preview || (type.options || {}).preview
  if (preview && 'fields' in preview) {
    // eslint-disable-next-line no-console
    console.warn(`Heads up! "preview.fields" should be renamed to "preview.select". Please update the preview config for "${type.name}".
`)
  }
}
