// Lazy entry for MemberFieldError: a dedicated module with a default export, so the `import()` in the
// facade resolves to its own chunk instead of a synthesised namespace of a shared chunk.
export {MemberFieldError as default} from './MemberFieldError'
