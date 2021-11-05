### @sanity/language-filter

A Sanity plugin that supports filtering localized fields by language

## Usage

### Install plugin

> sanity install @sanity/language-filter

Installing with `sanity install` updates your `sanity.json` to include this plugin. If installing with npm or yarn, ensure your `plugins` array includes `@sanity/language-filter`.

### Add config file

In order to know what languages are supported, this plugin needs to be set up with a config file that exports a few options.

This config file needs to implement the part `part:@sanity/language-filter/config`, by adding the following lines to the `parts`-section of your `sanity.json`

```json
{
  "name": "part:@sanity/language-filter/config",
  "path": "./parts/languageFilterConfig.js"
}
```

Here's an example `languageFilterConfig.js` file:

```js
export default {
  supportedLanguages: [
    {id: 'nb', title: 'Norwegian (Bokmål)'},
    {id: 'nn', title: 'Norwegian (Nynorsk)'},
    {id: 'en', title: 'English'},
    {id: 'es', title: 'Spanish'},
    {id: 'arb', title: 'Arabic'},
    {id: 'pt', title: 'Portuguese'}
    //...
  ],
  // Select Norwegian (Bokmål) by default
  defaultLanguages: ['nb'],
  // Only show language filter for document type `page` (schemaType.name)
  documentTypes: ['page'],
  filterField: (enclosingType, field, selectedLanguageIds) =>
    !enclosingType.name.startsWith('locale') || selectedLanguageIds.includes(field.name)
}
```

- `supportedLanguages` is an array of languages with `id` and `title`. If your localized fields are defined using our recommended way described here (https://www.sanity.io/docs/localization), you probably want to share this list of supported languages between this config and your schema.
- `defaultLanguages` (optional) is an array of strings where each entry must match an `id` from the `supportedLanguages` array. These languages will be listed by default and will not be possible to unselect. If no `defaultLanguages` is configured, all localized fields will be selected by default.
- `documentTypes` (optional) is an array of strings where each entry must match a `name` from your document schemas. If defined, this property will be used to conditionally show the language filter on specific document schema types. If undefined, the language filter will show on all document schema types.
- `filterField` is a function that must return true if the field should be displayed. It is passed the enclosing type (e.g the object type containing the localized fields, the field, and an array of the currently selected language ids.
