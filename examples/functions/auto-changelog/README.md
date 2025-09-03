# Auto-Changelog Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams need to track meaningful changes to documents for returning editors, but manually documenting every update is time-consuming and often forgotten during the editing process. Teams want to show content evolution while avoiding noise from minor formatting tweaks.

## Solution

This Sanity Function automatically generates changelog entries when documents are updated with meaningful changes. It uses AI to analyze both content and nested code block changes, filtering out formatting-only and minor modifications, and generates concise, reader-friendly descriptions of what actually changed. Fine-grained changes for all fields can still be track with Sanity's out of the box [History](https://www.sanity.io/docs/user-guides/history-experience).

## Benefits

- **Saves editorial time** by eliminating manual changelog maintenance
- **Improves reader experience** with clear change tracking for returning visitors
- **Reduces noise** by filtering out minor and formatting-only changes
- **Scales automatically** as content volume grows
- **Provides detailed code tracking** for technical posts with code examples
- **Maintains content history** for better editorial workflows

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
- A `content` field (rich text/portable text) for content analysis
- A `changelog` field (array of strings) for storing generated entries
- Access to Sanity's AI capabilities
- Production deployment for testing (local testing not supported)

## Usage Example

When a content editor updates a blog post with meaningful changes, the function automatically:

1. **Triggers** on update events for post documents with content or code block changes
2. **Filters** out formatting-only changes using intelligent comparison
3. **Analyzes** both content and code changes using AI
4. **Generates** a concise, reader-friendly description of what changed
5. **Appends** the changelog entry to the document's changelog array

**Result:** Readers see clear change tracking like "Fixed syntax for the API call to use await; Added more context about the implementation process" without noise from minor formatting tweaks.

### Adding the changelog field to your schema

You'll need to add a `changelog` field to your post schema:

1. Open your post schema file (e.g., `studio/src/schemaTypes/documents/post.ts`)
2. Add this field to the `fields` array:

```typescript
defineField({
  name: "changelog",
  title: "Changelog",
  type: "array",
  of: [
    defineArrayMember({
      type: "string",
    }),
  ],
  description: "List of changes made so returning readers can see how it has progressed.",
}),
```

3. Deploy your updated schema:

```bash
# From the studio/ folder
npx sanity schema deploy
```

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Initialize the example**

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

   ```bash
   npx sanity blueprints add function --example auto-changelog
   ```

2. **Add configuration to your blueprint**

   Add the following resource to your `sanity.blueprint.ts`:

   ```ts
   defineDocumentFunction({
     type: 'sanity.function.document',
     src: './functions/auto-changelog',
     memory: 2,
     timeout: 30,
     name: 'auto-changelog',
     event: {
       on: ['update'],
       filter:
         "_type == 'post' && (delta::changedAny(content) || delta::changedAny(content[_type == 'code']))",
       projection:
         "{_id, 'oldContent': pt::text(before().content), 'newContent': pt::text(after().content), changelog, 'oldCodeBlocks': before().content[_type == 'code'], 'newCodeBlocks': after().content[_type == 'code'], changelog}",
     },
   })
   ```

3. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install
   ```

4. **Make sure you have a schema deployed**

   From the studio folder, run:

   ```bash
   # In the studio/ folder
   npx sanity schema deploy
   ```

## Local Development Limitations

**Important:** This function cannot currently be tested locally as local development does not yet support GROQ functions and Delta GROQ operations used in the filter and projection.

The function uses:

- `delta::changedAny()` - GROQ delta functions for detecting changes
- `pt::text()` - GROQ functions for portable text processing
- Complex projections with `before()` and `after()` document states

These features are currently only available in the Sanity production environment.

### Testing Strategy

- **Deploy to production** for testing with real document updates
- **Monitor function logs** using the CLI:
  ```bash
  npx sanity functions logs auto-changelog --watch
  ```
- **Use staging/development dataset** if available for safer testing
- **Test with small content changes** to verify behavior

## Customization

### Add Datetime Tracking

To track when changes were made, you can add a datetime field to store timestamps alongside changelog entries. This requires modifying both your schema and the function:

1. **Update your schema** to include a datetime field for change tracking:

```typescript
defineField({
  name: "changeHistory",
  title: "Change History",
  type: "array",
  of: [
    defineArrayMember({
      type: "object",
      fields: [
        defineField({
          name: "change",
          title: "Change Description",
          type: "string",
        }),
        defineField({
          name: "timestamp",
          title: "Change Date",
          type: "datetime",
        }),
      ],
    }),
  ],
  description: "List of changes with timestamps for tracking when modifications were made.",
}),
```

2. **Update the function** to store both the change description and timestamp by modifying the function code to append objects instead of strings to the array.

### Modify AI Instructions

Customize the changelog generation style by editing the `instruction` string in `index.ts`:

```typescript
instruction: `
  Generate changelog entries focusing on:
  - Technical accuracy for code changes
  - User-facing impacts for content changes  
  - Concise, professional tone
  // ... your custom instructions
`
```

### Adjust Timeout

For longer posts with complex changes, you may need to increase the timeout:

```ts
timeout: 120, // Increase from 90 to 120 seconds
```

## Related Examples

- [Auto-Summary Function](../auto-summary/README.md) – Automatically generate summaries for documents using AI
- [Brand Voice Validator](../brand-voice-validator/README.md) – Validate content against brand guidelines
- [Auto-Tag Function](../auto-tag/README.md) – Automatically generate tags for documents using AI

---
