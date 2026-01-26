# Form

The form building system for Sanity Studio. This module provides components, hooks, and utilities for rendering and managing document editing forms, including input components, field rendering, and patch handling.

## Key Exports

### Context & Hooks

- `FormBuilderContext` - React context providing form builder configuration
- `useFormBuilder` - Hook to access form builder context
- `useDocumentForm` - Hook for managing document form state and operations
- `useDidUpdate` - Hook for tracking value changes

### Components

- Form field components for various input types
- Member rendering components for arrays and objects
- Custom input components

### Patch System

- `PatchEvent` - Event class representing document patches
- `PatchChannel` - Channel for patch communication
- `set`, `unset`, `insert`, `setIfMissing` - Patch operation creators
- `applyPatch` - Apply patches to documents

### Form State

- `useFormState` - Hook for managing form state
- `FormFieldGroup` - Field grouping utilities
- `StateTree` - State management for collapsed/expanded states

### Types

- `InputProps` - Props for input components
- `FieldProps` - Props for field components
- `ItemProps` - Props for array/object item components
- `ObjectInputProps`, `ArrayInputProps`, `StringInputProps`, etc.

## Usage

### Using the Document Form Hook

```ts
import {useDocumentForm} from 'sanity'

function MyDocumentEditor({documentId, documentType}) {
  const {
    value,
    validation,
    onChange,
    ready,
  } = useDocumentForm({
    documentId,
    documentType,
  })

  // Render your form...
}
```

### Creating Patch Events

```ts
import {PatchEvent, set, unset} from 'sanity'

// Set a value
const setPatch = PatchEvent.from(set('new value', ['fieldName']))

// Unset a value
const unsetPatch = PatchEvent.from(unset(['fieldName']))

// Apply to form
onChange(setPatch)
```

### Custom Input Components

```ts
import {type StringInputProps} from 'sanity'

function MyCustomStringInput(props: StringInputProps) {
  const {value, onChange, elementProps} = props
  
  return (
    <input
      {...elementProps}
      value={value || ''}
      onChange={(e) => onChange(PatchEvent.from(set(e.target.value)))}
    />
  )
}
```

## Internal Dependencies

- `../config` - Configuration types for form settings
- `../studio` - Studio context and source access
- `../validation` - Document validation integration
- `../hooks` - Shared React hooks

## Architecture

The form system is structured around:

1. **FormBuilderContext** - Provides rendering callbacks and configuration
2. **Patch System** - Handles document mutations through immutable patches
3. **Form State** - Manages expanded/collapsed states and focus
4. **Input Components** - Renders appropriate inputs based on schema types
5. **Member Rendering** - Handles arrays, objects, and nested structures

### Subdirectories

- `components/` - Reusable form components
- `hooks/` - Form-specific React hooks
- `inputs/` - Input components for different schema types
- `members/` - Array and object member renderers
- `patch/` - Patch creation and application utilities
- `store/` - Form state management
- `studio/` - Studio integration components
- `types/` - TypeScript type definitions
- `utils/` - Helper functions
