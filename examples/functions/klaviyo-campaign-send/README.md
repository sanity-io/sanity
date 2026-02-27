# Klaviyo Campaign Send Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Marketing teams create email campaigns but need a way to automatically send them when they're ready. Manually triggering campaign sends in Klaviyo creates delays and potential human error in the email marketing workflow.

## Solution

This Sanity Function automatically sends Klaviyo email campaigns when a marketing campaign document status is changed to 'ready' in Sanity. The function triggers the campaign send job in Klaviyo and updates both the marketing campaign and email document statuses to 'sent' to prevent duplicate sends.

## Benefits

- **Automated campaign sending** by triggering sends when campaigns are marked as ready
- **Status synchronization** by updating both marketing campaign and email document statuses
- **Error handling** with detailed logging for different failure scenarios
- **Prevents duplicate sends** by checking document status before sending
- **Seamless workflow** from content creation to campaign delivery

## Parallel Function Requirement

⚠️ **Important**: This function works in parallel with the [Klaviyo Campaign Create Function](../klaviyo-campaign-create/README.md). Both functions are required for a complete email marketing workflow:

1. **klaviyo-campaign-create** - Creates campaigns and templates from email content
2. **klaviyo-campaign-send** - Sends campaigns when they're marked as ready

You must install and configure both functions for successful campaign management.

## Compatible Templates

This function is built to be compatible with the [Sanity E-commerce template](https://www.sanity.io/templates/ecommerce-shopify). It works specifically with product data and is designed for e-commerce email marketing campaigns.

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

1. **Initialize the example**

   For a new project:

   ```bash
   npx sanity blueprints init --example klaviyo-campaign-send
   ```

   For an existing project:

   ```bash
   npx sanity blueprints add function --example klaviyo-campaign-send
   ```

   You'll be prompted to select your organization and Sanity studio.

2. **Add schema types to your project**

   Copy the schema files to your project:
   - `schema-emails.tsx` - Defines the email document type with rich content support
   - `schema-marketing-campaign.tsx` - Defines the marketing campaign document type

   Add them to your schema in `sanity.config.ts`:

   ```ts
   import {emailsType} from './schema-emails'
   import {marketingCampaignType} from './schema-marketing-campaign'

   export default defineConfig({
     // ... other config
     schema: {
       types: [
         // ... your existing types
         emailsType,
         marketingCampaignType,
       ],
     },
   })
   ```

3. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'
   import 'dotenv/config'
   import process from 'node:process'

   const {KLAVIYO_API_KEY} = process.env
   if (typeof KLAVIYO_API_KEY !== 'string') {
     throw new Error('KLAVIYO_API_KEY must be set')
   }

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'klaviyo-campaign-send',
         memory: 1,
         timeout: 30,
         src: './functions/klaviyo-campaign-send',
         event: {
           on: ['update'],
           filter: "_type == 'marketingCampaign' && status == 'ready'",
           projection: '{_id, _type, title, email, klaviyoCampaignId}',
         },
         env: {
           KLAVIYO_API_KEY: KLAVIYO_API_KEY,
         },
       }),
     ],
   })
   ```

4. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install dotenv
   ```

   And install function dependencies:

   ```bash
   npm install @sanity/functions
   cd functions/klaviyo-campaign-send
   npm install
   cd ../..
   ```

5. **Set up environment variables**

   Add your Klaviyo credentials to your root .env file:
   - `KLAVIYO_API_KEY`: Your Klaviyo private API key (requires campaigns:write scope)

6. **Deploy your schema**

   From the studio folder, deploy your updated schema:

   ```bash
   # From the studio/ folder (adjust path as needed for template structure)
   cd studio
   npx sanity schema deploy
   cd ..
   ```

## Testing the function locally

You can test the klaviyo-campaign-send function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### 1. Basic Function Test

Since document functions require the document ID to exist in your dataset, you'll need an existing marketing campaign document:

```bash
# From the studio/ folder, find an existing marketing campaign
cd studio
npx sanity documents query "*[_type == 'marketingCampaign'][0]" > ../real-campaign.json

# Back to project root for function testing
cd ..
npx sanity functions test klaviyo-campaign-send --file real-campaign.json --dataset production --with-user-token
```

**Alternative:** Create a test marketing campaign document first:

```bash
# From the studio/ folder, create a test marketing campaign
cd studio
cat > test-marketing-campaign.json << EOF
{
  "_type": "marketingCampaign",
  "title": "Test Campaign Send",
  "status": "ready",
  "klaviyoCampaignId": "your-klaviyo-campaign-id",
  "email": {"_ref": "existing-email-id", "_type": "reference"},
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
}
EOF

npx sanity documents create test-marketing-campaign.json --replace

# Back to project root for function testing
cd ..
npx sanity functions test klaviyo-campaign-send --file studio/test-marketing-campaign.json --dataset production --with-user-token
```

### 2. Interactive Development Mode

Start the development server for interactive testing:

```bash
npx sanity functions dev
```

This opens an interactive playground where you can test functions with custom data.

### 3. Test with Custom Data

For custom data testing, you still need to use a real document ID that exists in your dataset:

```bash
# From the studio/ folder, create or find a real document ID
cd studio
REAL_DOC_ID=$(npx sanity documents query "*[_type == 'marketingCampaign'][0]._id" | tr -d '"')

# Create a temporary JSON file with custom data in project root
cd ..
cat > test-custom-campaign.json << EOF
{
  "_type": "marketingCampaign",
  "_id": "$REAL_DOC_ID",
  "title": "Custom Test Campaign",
  "status": "ready",
  "klaviyoCampaignId": "your-test-campaign-id",
  "email": {"_ref": "existing-email-id", "_type": "reference"}
}
EOF

# Test with the custom data file
npx sanity functions test klaviyo-campaign-send --file test-custom-campaign.json --dataset production --with-user-token
```

### 4. Test with Real Document Data

The most reliable approach is to test with existing documents from your dataset:

```bash
# From the studio/ folder, find and export a document that matches your function's filter
cd studio
npx sanity documents query "*[_type == 'marketingCampaign' && status == 'ready'][0]" > ../test-real-campaign.json

# Back to project root for function testing
cd ..
npx sanity functions test klaviyo-campaign-send --file test-real-campaign.json --dataset production --with-user-token
```

### 5. Enable Debugging

The function includes comprehensive logging. Check the output for:

```typescript
// Function logs include:
console.log('🚀 Marketing Campaign Send Function called at', new Date().toISOString())
console.log('📢 Sending Klaviyo campaign:', klaviyoCampaignId)
console.log('✅ Campaign send job created successfully:', sendJobResponse.data.id)
```

### Testing Tips

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Use valid Klaviyo credentials** with campaigns:write scope
- **Test with existing campaigns** that are ready to send
- **Monitor Klaviyo dashboard** to verify campaigns are sent
- **Check function logs** for detailed error information
- **Be aware of rate limits** - Klaviyo allows 10/s burst, 150/m steady
- **Create test content** - If you don't have suitable documents, create some test documents first

## Requirements

- A Sanity project with Functions enabled
- The included schema types:
  - `marketingCampaign` document type (from `schema-marketing-campaign.tsx`)
  - `emails` document type (from `schema-emails.tsx`)
- A Klaviyo account with:
  - Private API key with campaigns:write scope
  - Existing campaigns created by the klaviyo-campaign-create function
- Node.js v22.x for local development
- The [Klaviyo Campaign Create Function](../klaviyo-campaign-create/README.md) must be installed and configured

## Usage Example

When a marketing campaign document status is changed to 'ready', the function automatically:

1. **Triggers** on update events for marketing campaign documents with status 'ready'
2. **Validates** that the marketing campaign has a valid Klaviyo campaign ID and email reference
3. **Sends** the campaign using Klaviyo's send API
4. **Updates** both the marketing campaign and email document statuses to 'sent'
5. **Prevents** duplicate sends by checking status before processing

**Sample input document:**

```json
{
  "_type": "marketingCampaign",
  "_id": "marketing-campaign-123",
  "title": "Product Launch Campaign",
  "status": "ready",
  "klaviyoCampaignId": "abc123",
  "klaviyoTemplateId": "def456",
  "email": {
    "_ref": "email-123",
    "_type": "reference"
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Result:** The Klaviyo campaign is sent, and both the marketing campaign and associated email document are marked as 'sent' with timestamps.

## Customization

### Error Handling

The function includes comprehensive error handling for common Klaviyo API errors:

```typescript
// Rate limiting
if (sendCampaignResponse.status === 429) {
  console.error('❌ Rate limit exceeded. Klaviyo allows 10/s burst, 150/m steady')
}

// Permission errors
if (sendCampaignResponse.status === 403) {
  console.error('❌ Forbidden. Check API key permissions (campaigns:write scope required)')
}

// Campaign not ready
if (sendCampaignResponse.status === 422) {
  console.error('❌ Unprocessable entity. Campaign may not be ready to send')
}
```

### Custom Status Updates

Modify the status update logic to include additional fields:

```typescript
// Update marketing campaign with custom fields
await client
  .patch(_id, {
    set: {
      status: 'sent',
      sentAt: new Date().toISOString(),
      sentBy: 'automated-function', // Custom field
      updatedAt: new Date().toISOString(),
    },
  })
  .commit()
```

### Pre-send Validation

Add custom validation before sending campaigns:

```typescript
// Add validation logic before sending
if (!emailDocument.title || emailDocument.title.trim().length === 0) {
  console.error('❌ Email must have a title before sending')
  return
}

// Check for required content
if (!emailDocument.body || emailDocument.body.length === 0) {
  console.error('❌ Email must have content before sending')
  return
}
```

## Troubleshooting

### Common Issues

**Error: "KLAVIYO_API_KEY not found in environment variables"**

- Cause: The Klaviyo API key is not set in your environment
- Solution: Add `KLAVIYO_API_KEY=your-api-key` to your `.env` file

**Error: "Failed to send Klaviyo campaign: 403 Forbidden"**

- Cause: Your API key doesn't have the required permissions
- Solution: Ensure your Klaviyo API key has `campaigns:write` scope

**Error: "Failed to send Klaviyo campaign: 422 Unprocessable Entity"**

- Cause: Campaign may not be ready to send (missing template, invalid audience, etc.)
- Solution: Verify the campaign is properly configured in Klaviyo with template and audience

**Error: "Failed to send Klaviyo campaign: 429 Rate limit exceeded"**

- Cause: Too many requests to Klaviyo API
- Solution: Klaviyo allows 10/s burst, 150/m steady. Wait and retry, or implement rate limiting

**Error: "Email document not found"**

- Cause: The marketing campaign references an email document that doesn't exist
- Solution: Ensure the email document referenced in the marketing campaign exists

**Error: "Klaviyo campaign ID not found in marketing campaign document"**

- Cause: The marketing campaign document is missing the klaviyoCampaignId field
- Solution: Ensure the klaviyo-campaign-create function ran successfully first

## Workflow Integration

This function is part of a complete email marketing workflow:

### Step 1: Content Creation

Use the `emails` document type to create rich email content with products, images, and text.

### Step 2: Campaign Creation

The [klaviyo-campaign-create function](../klaviyo-campaign-create/README.md) automatically creates Klaviyo campaigns and templates from email content.

### Step 3: Campaign Review

Review the created marketing campaign document and update its status to 'ready' when ready to send.

### Step 4: Campaign Send

This function automatically sends the campaign when the status changes to 'ready'.

### Status Flow

```
emails: inprogress → ready-for-review → ready → sent
marketingCampaign: draft → ready → sent
```

## Related Examples

- [Klaviyo Campaign Create Function](../klaviyo-campaign-create/README.md) - **Required parallel function** for creating campaigns and templates
- [Slack Notify Function](../slack-notify/README.md) - Send notifications when campaigns are sent
- [Auto-Tag Function](../auto-tag/README.md) - Automatically generate tags for content using AI
