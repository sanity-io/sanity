# Auto-Changelog Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Returning readers can see when an article was last updated, but not _what_ was changed. Meanwhile, content editors need to manually document meaningful changes for these readers, but this process is time-consuming and often forgotten during busy editing workflows. Teams want to show content evolution to readers while avoiding noise from minor formatting tweaks.

## Solution

This Sanity Function automatically generates changelog entries when documents are updated with meaningful changes. It uses AI to analyze content changes, filtering out minor modifications, and generates concise, reader-friendly descriptions of what actually changed. Fine-grained changes for all fields can still be track with Sanity's out of the box [History](https://www.sanity.io/docs/user-guides/history-experience).

## Benefits

**For readers:**

- **Clear change visibility** - Readers can see exactly what changed, not just when
- **Reduced noise** - Only meaningful updates are shown, filtering out minor formatting tweaks
- **Better return experience** - Returning visitors can quickly catch up on content evolution

**For content editors:**

- **Saves editorial time** - Eliminates manual changelog maintenance
- **Scales automatically** - No extra work as content volume grows
- **Improved workflows** - Focus on creating content rather than documenting changes

## Compatible Templates

This function is built to be compatible with any of [the official "clean" templates](https://www.sanity.io/exchange/type=templates/by=sanity). We recommend testing the function out in one of those after you have installed them locally.

## Requirements

- A Sanity project with Functions enabled
- A schema with a `post` document type containing:
  - A `content` field (rich text/portable text) for content analysis
  - A `changelog` field (array of strings) for storing generated entries
- Production deployment for testing (local testing not supported)

## Usage Example

**Editor workflow:** When a content editor updates a blog post with meaningful changes, they simply publish their changes as usual - no extra changelog work required.

**Behind the scenes,** the function automatically:

1. **Triggers** on update events for post documents with content changes
2. **Analyzes** content changes using AI
3. **Generates** a concise, reader-friendly description of what changed
4. **Appends** the changelog entry to the document's changelog array

**Reader outcome:** Visitors see clear change tracking like "Clarified explanation of the model's limitations; Added more context about the implementation process" without noise from minor wording tweaks, helping them understand exactly what's new since their last visit.

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

3. Configure your `content` field with basic block content:

```typescript
defineField({
  name: 'content',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
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
       filter: "_type == 'post' && delta::changedAny(content)",
       projection:
         "{_id, 'oldContent': pt::text(before().content), 'newContent': pt::text(after().content), changelog}",
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

## Testing the function locally

### 1. Test with Before/After Document States

The auto-changelog function uses delta GROQ operations (`delta::changedAny()`, `before()`, `after()`) to detect changes. To test this locally with the CLI, you need to provide both before and after versions of a document. This works well by making a draft of a document, and then using the documentId and the draft documentId:

```bash
npx sanity functions test auto-changelog --event update \
  --document-id-before <post-id> \
  --document-id-after draft:<post-id> \
  --dataset production \
  --with-user-token
```

### 2. Interactive Development Mode

For a more interactive testing experience, use the development server:

```bash
npx sanity functions dev
```

This opens a web UI where you can test the "before" and "after" data

### Advanced: Code Block Support

For advanced users who need automatic changelog tracking for code blocks within Portable Text, see this Gist with all three components:

- [Full index.ts with code block support](https://gist.github.com/kenjonespizza/a27eb263d0f474a9a212eae870605134#file-auto-changelog-with-code-blocks-index-ts)
- [Schema configuration with code blocks](https://gist.github.com/kenjonespizza/a27eb263d0f474a9a212eae870605134#file-post-ts)
- [Blueprint configuration with code blocks](https://gist.github.com/kenjonespizza/a27eb263d0f474a9a212eae870605134#file-sanity-blueprint-ts)

This adds:

- Automatic detection of code block changes
- Filtering of formatting-only changes
- AI-powered analysis of code modifications

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
