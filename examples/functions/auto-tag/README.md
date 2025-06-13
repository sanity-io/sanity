# Auto-Tag Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content creators often need to add relevant tags to blog posts, but manually tagging content is time-consuming and inconsistent.

## Solution

This Sanity Function automatically generates relevant tags for blog posts by analyzing their content using AI, prioritizing reuse of existing tags when appropriate.

## Benefits

- Saves content creators time by automating the tagging process
- Ensures consistent tagging across your content library
- Improves content discoverability and organization
- Maintains tag vocabulary by prioritizing reuse of existing tags

## Implementation

1. Initialize the example

```bash
npx sanity functions init --example auto-tag
```

2. Add the function configurations to your blueprint's resources array:

```json
{
  "name": "auto-tag",
  "memory": 2,
  "timeout": 30,
  "on": ["publish"],
  "filter": "_type == 'post' && !defined(tags)",
  "projection": "_id"
}
```

3. Install the function dependencies with your prefered package manager:

```bash
npm install
```

## Testing the function locally

You can test the auto-tag function locally using the Sanity CLI before deploying it to production:

### 1. Basic Function Test

Test the function with the included sample document:

```bash
npx sanity functions test auto-tag --file document.json
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data

### 3. Test with Custom Data

Test with your own document data:

```bash
npx sanity functions test auto-tag --data '{
  "_type": "post",
  "_id": "your-post-id",
  "body": "Your blog post content here..."
}'
```

### 4. Test with Real Document Data

Capture a real document from your dataset for testing:

```bash
# Export a real document for testing
npx sanity documents get "your-post-id" > test-document.json

# Test with the real document
npx sanity functions test auto-tag --file test-document.json
```

### 5. Enable Debugging

To see detailed logs during testing, modify the function temporarily to add logging:

```typescript
// Add this to your function for debugging
console.log('Event data:', JSON.stringify(event.data, null, 2))
console.log('Generated tags:', result.tags)
```

### Testing Tips

- **Use Node.js v22.x** locally to match the production runtime environment
- **Test without AI calls** first by setting `noWrite: true` in the function
- **Check the function logs** in the CLI output for debugging information
- **Test edge cases** like posts without content or with existing tags

## Requirements

- A Sanity project
- A schema with a `post` document type containing a `content` field and a `tags` array field
- Sanity Functions enabled for your project
- Access to Sanity's AI capabilities

## Usage Example

When a content editor publishes a new blog post without tags, the function automatically:

1. Triggers on the publish event for post documents without tags
2. Fetches the content of the post
3. Retrieves existing tags used across other posts
4. Uses AI to generate 3 relevant tags based on the content
5. Prioritizes reusing existing tags when appropriate
6. Writes the generated tags directly to the published document

This results in consistent, automated tagging without requiring manual effort from content creators.
