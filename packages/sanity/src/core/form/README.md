# Form

Form rendering and document editing system for Sanity Studio. This module provides the complete form builder architecture for editing structured content.

## Purpose

The form module handles all aspects of document editing in Sanity Studio:

- **Form state management** - Track document values, focus, validation, and field state
- **Input components** - Render appropriate inputs for each schema field type
- **Patch system** - Generate and apply document mutations as granular patches
- **Form builder context** - Provide rendering callbacks and configuration to nested components
- **Custom input support** - Allow plugins to provide custom input components

The form builder uses a recursive rendering approach where each field delegates to the appropriate input component based on schema type. The `FormBuilderContext` provides render callbacks that can be customized at any level.

## Key Exports

- `FormBuilderContext` / `FormBuilderContextValue` - React context providing form configuration
- `useDocumentForm` - Main hook for document editing (focus, patches, validation, presence)
- `useFormBuilder` - Access the form builder context
- `useFormState` - Compute form state from document value and schema
- `PatchEvent` - Class for creating patch events
- `set`, `unset`, `insert`, `setIfMissing` - Patch helper functions

## Key Files

- `FormBuilderContext.ts` - Context definition for form builder configuration
- `useDocumentForm.ts` - Primary hook for document editing (~600 lines)
- `useFormBuilder.ts` - Hook to access form builder context

### Subdirectories

- `inputs/` - Input components for different field types (string, number, array, object, etc.)
- `members/` - Components for rendering object members and array items
- `patch/` - Patch creation and application utilities
- `store/` - Form state computation and management (~1500 lines in `formState.ts`)
- `studio/` - Studio-specific form integration
- `types/` - TypeScript type definitions for form props and callbacks
- `components/` - Shared form UI components
- `field/` - Field-level utilities and hooks
- `utils/` - Helper functions for paths, mutations, and validation

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  useDocumentForm                     │
│  (orchestrates editing: focus, patches, presence)   │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               FormBuilderContext                     │
│  (render callbacks, asset sources, patch channel)   │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  Form State                          │
│  (computed from value + schema + validation)        │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Input Components                        │
│  (render UI, emit PatchEvents on change)            │
└─────────────────────────────────────────────────────┘
```

## Usage Example

```typescript
import {useDocumentForm, PatchEvent, set} from 'sanity'

// In a custom document view
function MyDocumentEditor({documentId, documentType}) {
  const {
    value,
    onChange,
    focusPath,
    onFocus,
    validation,
    ready,
  } = useDocumentForm({
    documentId,
    documentType,
  })

  // Handle a field change
  const handleTitleChange = (newTitle: string) => {
    onChange(PatchEvent.from(set(newTitle, ['title'])))
  }

  if (!ready) return <div>Loading...</div>

  return (
    <div>
      <input
        value={value?.title || ''}
        onChange={(e) => handleTitleChange(e.target.value)}
      />
    </div>
  )
}
```

## Related Modules

- [`../config`](../config/) - Form configuration options
- [`../store`](../store/) - Document store that persists form changes
- [`../hooks`](../hooks/) - Hooks like `useDocumentOperation` for saving
- [`../inputs`](../inputs/) - Additional input component implementations
