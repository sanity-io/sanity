# Media Library Auto Alt Text Function

[Explore all examples](https://github.com/sanity-io/sanity/tree/main/examples)

## Problem

Content teams need to provide accessible alt text for images across multiple languages, but manually writing alt text for every asset is time-consuming and often inconsistent. With global audiences, creating multilingual alt text becomes even more challenging, leading to accessibility gaps and poor user experience for screen reader users.

## Solution

This Sanity Function automatically generates multilingual alt text for assets in your Media Library using Agent Actions. When an asset is created or updated, the function waits for Sanity's auto-generated keywords to be available, then uses Agent Actions to create concise, descriptive alt text in multiple languages that you provide. The generated alt text is stored in the asset's aspect.

## Benefits

- **Accessibility by default** - Every image gets descriptive alt text automatically
- **Multilingual support** - Generate alt text in multiple languages simultaneously
- **Customizable prompts** - Adjust the AI prompt to match your brand voice and requirements
- **Editable results** - Generated alt text can be reviewed and edited in the Media Library UI
- **Time savings** - Eliminate manual alt text creation while maintaining quality and consistency

## Compatible Templates

This function is built to work with any Sanity project that has Media Library enabled. It operates on assets in your Media Library and doesn't require any specific Studio template.

### Understanding Aspects

This function uses **aspects** to store custom metadata on assets. Aspects are schema-style fields that apply to assets and help organize and identify them with additional metadata.

**This function includes one aspect:**

- `altText.ts` - Defines the structure and editing UI for multilingual alt text

**Important notes:**

- Aspects are defined by developers and applied to assets by the system or users
- Aspects are stored in the `aspects` object on each asset

## Requirements

- **Media Library** - This function operates on assets in your Media Library
- **Media Library Aspect Setup** - You need to setup the aspect first.

## Implementation

**Important:** Run these commands from the root of your project (not inside the `studio/` folder).

2. **Initialize the example**

   Run this if you haven't initialized blueprints:

   ```bash
   npx sanity blueprints init
   ```

   You'll be prompted to select your organization and Sanity studio.

   Then run:

   ```bash
   npx sanity blueprints add function --example media-library-auto-alt-text
   ```

3. **Find your Media Library ID**

   You'll need your Media Library ID to configure the function. Find it by going to your Media Library and check the URL `https://www.sanity.io/@<organizationId>/media/<mediaLibraryId>/assets`

4. **Add configuration to your blueprint**

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineMediaLibraryAssetFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineMediaLibraryAssetFunction({
         name: 'media-library-auto-alt-text',
         memory: 2,
         timeout: 30,
         src: './functions/media-library-auto-alt-text',
         event: {
           on: ['create', 'update'],
           filter: 'assetType == "sanity.imageAsset" && !defined(aspects.altText)',
           projection: '{ _id, currentVersion }',
           resource: {
             type: 'media-library',
             id: '<your-media-library-id>', // TODO: replace with your media library id
           },
         },
       }),
     ],
   })
   ```

5. **Install dependencies**

   Install dependencies in the project root and in the functions directory:

   ```bash
   # Install in the functions directory
   cd functions/
   pnpm install
   ```

## Testing the function locally

You can test the media-library-auto-alt-text function locally using the Sanity CLI before deploying it to production.

## Deploying your function

Once you've tested your function locally and are satisfied with its behavior, you can deploy it to production.

### Prerequisites for deployment

- Media Library enabled on your project

### Deploy to production

1. **Deploy your blueprint**

   From your project root, run:

   ```bash
   npx sanity blueprints deploy
   ```

   This command will:
   - Package your function code
   - Upload it to Sanity's infrastructure
   - Configure the event triggers for asset creation/updates
   - Make your function live in production

2. **Verify deployment**

   After deployment, you can verify your function is active by:
   - Uploading a new asset to your Media Library
   - Waiting for Media Library alt text to be generated (usually takes a few seconds)
   - Checking the asset's aspects for the generated alt text
   - Monitoring function logs in the Sanity CLI

### How the Function Works

When an asset is created or updated in your Media Library, the function follows this workflow:

1. **Trigger**: Function activates on asset creation or update
2. **Check for existing data**: If the asset already has `altText` in its aspects, the function exits to prevent loops
3. **Wait for Media Library keywords**: The function waits for Sanity's auto-generated keywords to be available. It is configured to do some re-try's.
4. **Generate alt text**: Using those keywords, it makes a separate Agent Action call for each language (Dutch, English, French, German), generating concise alt text one language at a time for reliability
5. **Save aspects**: The alt text array is written to the asset's aspects

### Customizing Languages

To add or remove languages, modify the function code in `functions/media-library-auto-alt-text/index.ts`:

1. Update the `languages` array with your desired language codes
2. Redeploy the function

### Editing Generated Alt Text

The generated alt text can be edited directly in the Media Library UI:

1. Open an asset in Media Library
2. Navigate to the Aspects panel
3. Edit the alt text for any language
4. Changes are saved immediately

## Troubleshooting

### Common Issues

**Error: "No Media Library keywords found"**

- Cause: Sanity's machine learning hasn't generated keywords yet, or the image type isn't supported
- Solution: Wait a few seconds after upload. The function includes retry logic. Check that the asset is an image type that Media Library can process.

**Function triggering in a loop**

- Cause: The function is updating the asset, which triggers itself again
- Solution: The function includes loop prevention logic by checking for existing altText. Ensure this logic isn't removed.

**Generated alt text is not relevant**

- Cause: Media Library keywords may not accurately describe the image, or the AI prompt needs adjustment
- Solution: Edit the alt text manually in the Media Library UI, or adjust the prompt in the function code to better match your needs

### Understanding the Data Structure

**Asset Container vs. Image Asset:**

The Media Library distinguishes between two connected entities:

- **Asset Container** - The "master" document representing the media item, where your custom aspects are stored
- **Image Asset** - The actual image file with system-level metadata (dimensions, EXIF, keywords). The Asset Container wil contain a reference to the image asset.

**Where data lives:**

- Custom aspects (`altText`) → Asset container's `aspects` object
- Auto generated keywords → Image asset's `metadata.keywords` array (this is automatically done when you upload a new image).
- Image dimensions, EXIF data → Image asset's `metadata` object

**Accessing image metadata:**

To access keywords and other image data that lives on the image asset, dereference the `currentVersion` reference:

```groq
*[_id == $assetContainerId][0]{
  ...,
  "metadata": currentVersion->{
    metadata
  }
}
```

## Understanding Media Library Asset Data Structure

This section provides technical details about how Media Library structures asset data. This is useful when building or debugging functions.

### Asset Container Structure

When you query an asset from the Media Library, you get a structure like this (with anonymized values):

```json
{
  "_createdAt": "2025-01-01T12:00:00Z",
  "_id": "<asset-id>",
  "_rev": "<revision-id>",
  "_system": {
    "createdBy": "<user-id>"
  },
  "_type": "sanity.asset",
  "_updatedAt": "2025-01-02T15:00:00Z",
  "aspects": {
    "altText": [
      {
        "_key": "<key-1>",
        "_type": "altTextItem",
        "language": "nl",
        "value": "voorbeeld alt text"
      },
      {
        "_key": "<key-2>",
        "_type": "altTextItem",
        "language": "en",
        "value": "Example alt text"
      }
    ]
  },
  "assetType": "sanity.imageAsset",
  "cdnAccessPolicy": "public",
  "currentVersion": {
    "_ref": "<image-asset-version-ref>",
    "_type": "reference"
  },
  "title": "example-image.png",
  "versions": [
    {
      "_key": "<version-key-1>",
      "_type": "sanity.asset.version",
      "instance": {
        "_ref": "<image-asset-version-ref>",
        "_type": "reference"
      },
      "title": "example-image.png"
    }
  ]
}
```

**Key Points:**

- The `aspects` object contains your custom metadata (fully customizable)
- The `currentVersion` field references the actual image document
- The `versions` array tracks all versions of the asset (enabling asset versioning)

### Image Asset Structure

The actual image metadata lives on the **image document**, not the asset container. To access this data, dereference the `currentVersion` reference.

#### Querying Image Metadata

Use this GROQ query to get the full image data:

```groq
*[_id == $currentVersion._ref][0]
```

This returns the underlying image with detailed metadata:

```json
{
  "_id": "<image-asset-version-id>",
  "_type": "sanity.imageAsset",
  "metadata": {
    "_type": "sanity.imageMetadata",
    "blurHash": "<blur hash string>",
    "dimensions": {
      "_type": "sanity.imageDimensions",
      "aspectRatio": 0.68,
      "height": 1200,
      "width": 810
    },
    "hasAlpha": false,
    "isOpaque": true,
    "keywords": ["movie poster", "character", "studio", "red cape"],
    "lqip": "<data-url>",
    "palette": {
      "_type": "sanity.imagePalette",
      "darkMuted": {
        "_type": "sanity.imagePaletteSwatch",
        "background": "#4c3134",
        "foreground": "#fff",
        "population": 0.36,
        "title": "#fff"
      }
    }
  },
  "originalFilename": "<image-file-name>.jpg",
  "mimeType": "image/jpeg",
  "cdnAccessPolicy": "public"
}
```

**Important Notes:**

- Media Library-generated keywords are in `metadata.keywords` on the image asset
- Always access image metadata from the dereferenced `currentVersion` for accuracy

### Best Practices

1. **Access Media Library keywords from the image asset**, not the asset container
2. **Store custom metadata in aspects** on the asset container
3. **Prevent update loops** by checking for existing aspect data before updating
