# Klaviyo Campaign Create Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Marketing teams need to create email campaigns for their content, but manually creating Klaviyo campaigns and templates for each post is time-consuming and error-prone. This creates delays between content creation and email marketing campaigns.

## Solution

This Sanity Function automatically creates Klaviyo email campaigns and templates when email content is created or updated in Sanity. When an email document is created, the function generates a Klaviyo template from the content, creates a campaign, and links them together. For updates, it refreshes the template content to keep campaigns synchronized with the latest content changes.

## Benefits

- **Automated campaign creation** by generating Klaviyo campaigns and templates from Sanity content
- **Reduces manual work** by eliminating the need to manually create campaigns in Klaviyo
- **Content synchronization** by updating templates when content changes
- **Rich email templates** with support for products, images, and formatted text
- **Seamless integration** between Sanity content management and Klaviyo email marketing

## Parallel Function Requirement

⚠️ **Important**: This function works in parallel with the [Klaviyo Campaign Send Function](../klaviyo-campaign-send/README.md). Both functions are required for a complete email marketing workflow:

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
   npx sanity blueprints init --example klaviyo-campaign-create
   ```

   For an existing project:

   ```bash
   npx sanity blueprints add function --example klaviyo-campaign-create
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

   const {KLAVIYO_API_KEY, KLAVIYO_LIST_ID} = process.env
   if (typeof KLAVIYO_API_KEY !== 'string' || typeof KLAVIYO_LIST_ID !== 'string') {
     throw new Error('KLAVIYO_API_KEY and KLAVIYO_LIST_ID must be set')
   }

   export default defineBlueprint({
     resources: [
       defineDocumentFunction({
         type: 'sanity.function.document',
         name: 'klaviyo-campaign-create',
         memory: 1,
         timeout: 30,
         src: './functions/klaviyo-campaign-create',
         event: {
           on: ['create', 'update'],
           filter: "_type == 'emails' && status != 'sent'",
           projection:
             '{_id, _type, title, slug, body, marketingCampaign, klaviyoListId, "operation": delta::operation()}',
         },
         env: {
           KLAVIYO_API_KEY: KLAVIYO_API_KEY,
           KLAVIYO_LIST_ID: KLAVIYO_LIST_ID,
           KLAVIYO_FROM_EMAIL: process.env.KLAVIYO_FROM_EMAIL || 'noreply@yourdomain.com',
           KLAVIYO_REPLY_TO_EMAIL: process.env.KLAVIYO_REPLY_TO_EMAIL || 'reply-to@yourdomain.com',
           KLAVIYO_CC_EMAIL: process.env.KLAVIYO_CC_EMAIL || 'cc@yourdomain.com',
           KLAVIYO_BCC_EMAIL: process.env.KLAVIYO_BCC_EMAIL || 'bcc@yourdomain.com',
         },
       }),
     ],
   })
   ```

4. **Install dependencies**

   Install dependencies in the project root:

   ```bash
   npm install dotenv @portabletext/to-html
   ```

   And install function dependencies:

   ```bash
   npm install @sanity/functions
   cd functions/klaviyo-campaign-create
   npm install
   cd ../..
   ```

5. **Set up environment variables**

   Add your Klaviyo credentials to your root .env file:
   - `KLAVIYO_API_KEY`: Your Klaviyo private API key
   - `KLAVIYO_LIST_ID`: Your Klaviyo list ID for email campaigns
   - `KLAVIYO_FROM_EMAIL`: Email address for campaign sender (optional)
   - `KLAVIYO_REPLY_TO_EMAIL`: Reply-to email address (optional)
   - `KLAVIYO_CC_EMAIL`: CC email address (optional)
   - `KLAVIYO_BCC_EMAIL`: BCC email address (optional)

6. **Deploy your schema**

   From the studio folder, deploy your updated schema:

   ```bash
   # From the studio/ folder (adjust path as needed for template structure)
   cd studio
   npx sanity schema deploy
   cd ..
   ```

## Testing the function locally

You can test the klaviyo-campaign-create function locally using the Sanity CLI before deploying it to production.

**Important:** Document functions require that the document ID used in testing actually exists in your dataset. The examples below show how to work with real document IDs.

### 1. Basic Function Test

Since document functions require the document ID to exist in your dataset, create a test document first:

```bash
# From the studio/ folder, create a test document
cd studio
npx sanity documents create ../functions/klaviyo-campaign-create/document.json --replace
```

Then test the function with the created document (from project root):

```bash
# Back to project root for function testing
cd ..
npx sanity functions test klaviyo-campaign-create --file functions/klaviyo-campaign-create/document.json --dataset production --with-user-token
```

**Alternative:** Test with a real document from your dataset:

```bash
# From the studio/ folder, find and export an existing document
cd studio
npx sanity documents query "*[_type == 'emails'][0]" > ../real-document.json

# Back to project root for function testing
cd ..
npx sanity functions test klaviyo-campaign-create --file real-document.json --dataset production --with-user-token
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
REAL_DOC_ID=$(npx sanity documents query "*[_type == 'emails'][0]._id" | tr -d '"')

# Create a temporary JSON file with custom data in project root
cd ..
cat > test-custom-data.json << EOF
{
  "_type": "emails",
  "_id": "$REAL_DOC_ID",
  "title": "Custom Test Email Campaign",
  "body": [
    {
      "_type": "block",
      "children": [{"_type": "span", "text": "Custom test content"}]
    }
  ],
  "status": "inprogress"
}
EOF

# Test with the custom data file
npx sanity functions test klaviyo-campaign-create --file test-custom-data.json --dataset production --with-user-token
```

### 4. Test with Real Document Data

The most reliable approach is to test with existing documents from your dataset:

```bash
# From the studio/ folder, find and export a document that matches your function's filter
cd studio
npx sanity documents query "*[_type == 'emails' && status != 'sent'][0]" > ../test-real-document.json

# Back to project root for function testing
cd ..
npx sanity functions test klaviyo-campaign-create --file test-real-document.json --dataset production --with-user-token
```

### 5. Enable Debugging

The function includes comprehensive logging. Check the output for:

```typescript
// Function logs include:
console.log('👋 Marketing Campaign Function called at', new Date().toISOString())
console.log('✅ Created Klaviyo template:', template.data.id)
console.log('✅ Created Klaviyo campaign:', campaign.data.id)
```

### Testing Tips

- **Use real document IDs** - Document functions require IDs that exist in your dataset
- **Query for test documents** - Use `npx sanity documents query` to find suitable test documents
- **Use Node.js v22.x** locally to match production runtime
- **Test with valid Klaviyo credentials** to ensure proper campaign creation
- **Test with email documents** containing products and rich content
- **Monitor Klaviyo dashboard** to verify campaigns and templates are created
- **Check function logs** for detailed operation information
- **Create test content** - If you don't have suitable documents, create some test documents first

## Requirements

- A Sanity project with Functions enabled
- The included schema types:
  - `emails` document type (from `schema-emails.tsx`)
  - `marketingCampaign` document type (from `schema-marketing-campaign.tsx`)
  - `product` document type (from e-commerce template)
- A Klaviyo account with:
  - Private API key
  - A configured email list
  - Proper sender authentication
- Node.js v22.x for local development

## Usage Example

When a content editor creates or updates an email document, the function automatically:

1. **Triggers** on create/update events for email documents
2. **Extracts** the document data including title, body content, and products
3. **Generates** HTML and text email templates from the content
4. **Creates** a Klaviyo campaign and template (on create) or updates the template (on update)
5. **Links** the campaign to a marketing campaign document in Sanity

**Sample input document:**

```json
{
  "_type": "emails",
  "_id": "test-email-123",
  "title": "New Product Launch",
  "body": [
    {
      "_type": "block",
      "children": [{"_type": "span", "text": "Check out our new products!"}]
    },
    {
      "_type": "products",
      "products": [{"_ref": "product-123", "_type": "reference"}]
    }
  ],
  "status": "inprogress",
  "klaviyoListId": "optional-list-override"
}
```

**Result:** A Klaviyo campaign and template are created with rich HTML content including product information, and a marketing campaign document is created in Sanity to track the relationship.

## Customization

### Modify Email Template

Update the HTML template generation in the `generateEmailTemplate` function:

```typescript
// Customize the email template design
async function generateEmailTemplate(
  title: string | undefined,
  slug: string | undefined,
  body: any[] | undefined,
): Promise<string> {
  // Modify the HTML structure, styling, or content
  // Add custom components for different content types
  // Update branding, colors, and layout
}
```

### Change Klaviyo List

Override the default Klaviyo list by setting `klaviyoListId` on individual email documents:

```typescript
// In your email document
{
  klaviyoListId: 'your-custom-list-id' // Overrides KLAVIYO_LIST_ID env var
}
```

### Add Content Types

Extend the portable text rendering to support additional content types:

```typescript
// In the toHTML components configuration
components: {
  types: {
    // Add custom content type rendering
    customBlock: ({value}) => {
      return `<div class="custom-content">${value.content}</div>`
    }
  }
}
```

### Update Email Sender Information

Modify sender details through environment variables:

```typescript
// Environment variables for email configuration
KLAVIYO_FROM_EMAIL=your-sender@domain.com
KLAVIYO_REPLY_TO_EMAIL=reply@domain.com
```

## Troubleshooting

### Common Issues

**Error: "KLAVIYO_API_KEY not found in environment variables"**

- Cause: The Klaviyo API key is not set in your environment
- Solution: Add `KLAVIYO_API_KEY=your-api-key` to your `.env` file

**Error: "Failed to create Klaviyo template: 403 Forbidden"**

- Cause: Your API key doesn't have the required permissions
- Solution: Ensure your Klaviyo API key has `templates:write` scope

**Error: "Failed to create Klaviyo campaign: 422 Unprocessable Entity"**

- Cause: Missing required campaign data or invalid list ID
- Solution: Verify your `KLAVIYO_LIST_ID` is correct and the list exists in your Klaviyo account

**Error: "Post title is required for template creation"**

- Cause: The email document doesn't have a title field
- Solution: Ensure your email document has a `title` field with content

**Function times out during execution**

- Cause: Complex email content or slow Klaviyo API responses
- Solution: Increase the timeout value in your blueprint configuration (current: 30 seconds)

## Schema Files

This function requires two schema files to be added to your Sanity project:

### schema-emails.tsx

Defines the `emails` document type with:

- Rich text content with product embedding support
- Status tracking (inprogress, ready-for-review, ready, sent)
- Optional Klaviyo list ID override
- Marketing campaign reference

### schema-marketing-campaign.tsx

Defines the `marketingCampaign` document type with:

- Reference to the source email content
- Klaviyo campaign and template IDs
- Status tracking (draft, ready, sent)
- Timestamps for creation and updates

## Related Examples

- [Klaviyo Campaign Send Function](../klaviyo-campaign-send/README.md) - **Required parallel function** for sending campaigns when ready
- [Slack Notify Function](../slack-notify/README.md) - Send notifications when campaigns are created or sent
- [Auto-Tag Function](../auto-tag/README.md) - Automatically generate tags for content using AI
