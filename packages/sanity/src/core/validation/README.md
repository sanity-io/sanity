# Validation

The document validation system for Sanity Studio. This module provides schema-based validation rules, document validation execution, and validation status tracking with support for both synchronous and asynchronous validation.

## Key Exports

### Core Classes

- `Rule` - Validation rule builder with chainable methods for defining constraints

### Validation Functions

- `validateDocument` - Validate a document against its schema (returns Promise)
- `validateDocumentObservable` - Validate a document (returns Observable)
- `validateDocumentWithReferences` - Validate with reference resolution
- `inferFromSchema` - Infer validation rules from a complete schema
- `inferFromSchemaType` - Infer validation rules from a schema type

### Types

- `ValidationContext` - Context passed to custom validators
- `ValidationStatus` - Current validation state with markers
- `ValidateDocumentOptions` - Options for document validation

## Usage

### Defining Validation Rules in Schema

```ts
import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required().min(10).max(100),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      validation: (Rule) => Rule.required().min(new Date().toISOString()),
    }),
  ],
})
```

### Custom Validation Functions

```ts
defineField({
  name: 'email',
  type: 'string',
  validation: (Rule) => Rule.custom((value, context) => {
    if (!value) return true // Let required() handle empty
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    
    return true
  }),
})
```

### Async Validation

```ts
defineField({
  name: 'username',
  type: 'string',
  validation: (Rule) => Rule.custom(async (value, context) => {
    if (!value) return true
    
    const client = context.getClient({apiVersion: '2024-01-01'})
    const existing = await client.fetch(
      '*[_type == "user" && username == $username && _id != $id][0]',
      {username: value, id: context.document?._id}
    )
    
    if (existing) {
      return 'This username is already taken'
    }
    
    return true
  }),
})
```

### Validating a Document Programmatically

```ts
import {validateDocument} from 'sanity'

const markers = await validateDocument({
  document: myDocument,
  schema,
  getClient,
  getDocumentExists,
})

const errors = markers.filter(m => m.level === 'error')
const warnings = markers.filter(m => m.level === 'warning')
```

### Using Validation Status Hook

```ts
import {useValidationStatus} from 'sanity'

function ValidationIndicator({documentId, documentType}) {
  const {isValidating, validation} = useValidationStatus(documentId, documentType)
  
  if (isValidating) return <Spinner />
  
  const errorCount = validation.filter(v => v.level === 'error').length
  const warningCount = validation.filter(v => v.level === 'warning').length
  
  return (
    <div>
      {errorCount > 0 && <span>{errorCount} errors</span>}
      {warningCount > 0 && <span>{warningCount} warnings</span>}
    </div>
  )
}
```

## Internal Dependencies

- `@sanity/schema` - Base Rule class
- `@sanity/types` - Type definitions for validation
- `../util` - Utility functions

## Architecture

### Validation Flow

1. Schema types define validation rules using `Rule` builder
2. `inferFromSchemaType` extracts rules from schema definitions
3. `validateDocument` traverses the document and executes rules
4. Validation markers are collected with paths and messages
5. UI displays markers at appropriate field locations

### Rule Builder

The `Rule` class provides a fluent API for building validation constraints:

```ts
Rule
  .required()           // Field must have a value
  .min(5)              // Minimum value/length
  .max(100)            // Maximum value/length
  .length(10)          // Exact length
  .regex(/pattern/)    // Match regex pattern
  .unique()            // Unique in array
  .custom(fn)          // Custom validation function
  .warning()           // Mark as warning instead of error
  .error('message')    // Custom error message
```

### Validators by Type

- `stringValidator` - String length, regex, email, URL, etc.
- `numberValidator` - Min, max, integer, positive, etc.
- `arrayValidator` - Min/max items, unique
- `objectValidator` - Required fields
- `dateValidator` - Min/max date
- `booleanValidator` - Boolean checks
- `slugValidator` - Slug format and uniqueness
- `genericValidator` - Common validators for all types

### Subdirectories

- `validators/` - Type-specific validation implementations
- `util/` - Helper functions (message localization, path handling, etc.)

### Key Concepts

- **ValidationMarker** - A validation result with level, message, and path
- **ValidationContext** - Context available to custom validators (document, schema, client)
- **Rule** - Builder for defining validation constraints
- **Level** - Severity of validation result (error, warning, info)

## Performance Considerations

- Async validations run in parallel where possible
- Document existence checks are batched
- Validation is debounced during rapid edits
- Results are cached until the document changes
