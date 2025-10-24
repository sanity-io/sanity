# Auto-Changelog Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Returning readers can see when an article was last updated, but not _what_ was changed. Meanwhile, content editors need to manually document meaningful changes for these readers, but this process is time-consuming and often forgotten during busy editing workflows. Teams want to show content evolution to readers while avoiding noise from minor formatting tweaks.

## Solution

This Sanity Function automatically generates changelog entries when documents are updated with meaningful changes. It uses AI to analyze both content and nested code block changes, filtering out formatting-only and minor modifications, and generates concise, reader-friendly descriptions of what actually changed. Fine-grained changes for all fields can still be track with Sanity's out of the box [History](https://www.sanity.io/docs/user-guides/history-experience).

## Benefits

**For readers:**

- **Clear change visibility** - Readers can see exactly what changed, not just when
- **Reduced noise** - Only meaningful updates are shown, filtering out minor formatting tweaks
- **Better return experience** - Returning visitors can quickly catch up on content evolution

**For content editors:**

- **Saves editorial time** - Eliminates manual changelog maintenance
- **Scales automatically** - No extra work as content volume grows
- **Detailed code tracking** - Automatically captures technical changes in code examples
- **Improved workflows** - Focus on creating content rather than documenting changes

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `content` field (rich text/portable text) for content analysis
  - A `changelog` field (array of strings) for storing generated entries
- Block content configuration with code block support (using [code-input plugin](https://www.sanity.io/plugins/code-input))
- Production deployment for testing (local testing not supported)

## Usage Example

**Editor workflow:** When a content editor updates a blog post with meaningful changes, they simply publish their changes as usual - no extra changelog work required.

**Behind the scenes,** the function automatically:

1. **Triggers** on update events for post documents with content or code block changes
2. **Filters** out formatting-only changes using intelligent comparison
3. **Analyzes** both content and code changes using AI
4. **Generates** a concise, reader-friendly description of what changed
5. **Appends** the changelog entry to the document's changelog array

**Reader outcome:** Visitors see clear change tracking like "Fixed syntax for the API call to use await; Added more context about the implementation process" without noise from minor formatting tweaks, helping them understand exactly what's new since their last visit.

### Adding required fields to your schema

You'll need to add both a `changelog` field and properly configured block content to your post schema:

1. Open your post schema file (e.g., `studio/src/schemaTypes/documents/post.ts`)
2. Add the changelog field to the `fields` array:

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

3. Configure your `content` field to support code blocks using the [code-input plugin](https://www.sanity.io/plugins/code-input):

```typescript
defineField({
  name: 'content',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
    }),
    defineField({
      type: 'code',
      name: 'code',
      title: 'Code',
    }),
  ],
}),
```

4. Deploy your updated schema:

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
         "{_id, 'oldContent': pt::text(before().content), 'newContent': pt::text(after().content), changelog, 'oldCodeBlocks': before().content[_type == 'code'], 'newCodeBlocks': after().content[_type == 'code']}",
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
