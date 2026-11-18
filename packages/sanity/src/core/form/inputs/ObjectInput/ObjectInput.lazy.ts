// Lazy entry for ObjectInput: a dedicated module with a default export, so the `import()` in the
// facade resolves to its own chunk instead of a synthesised namespace of a shared chunk.
export {ObjectInput as default} from './ObjectInput'
