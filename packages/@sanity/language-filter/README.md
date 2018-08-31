### @sanity/language-filter

A Sanity plugin that supports filtering localized fields by language

## Usage

### Install plugin

> sanity install @sanity/language-filter

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
    // If your localized fields are set up using the 
    {id: 'nb', title: 'Norwegian (Bokmål)'},
    {id: 'nn', title: 'Norwegian (Nynorsk)'},
    {id: 'en', title: 'English'},
    {id: 'es', title: 'Spanish'},
    {id: 'arb', title: 'Arabic'},
    {id: 'pt', title: 'Portuguese'}
    //...
  ],
  filterFn: (enclosingType, field, selectedLanguageIds) =>
    !enclosingType.name.startsWith('locale') || selectedLanguageIds.includes(field.name)
}
```

- `supportedLanguages` is an array of languages with `id` and `title`. If your localized fields are defined using our recommended way described here (https://www.sanity.io/docs/localization), you probably want to share this list of supported languages between this config and your schema. 
- `filterFn` is a function that must return true if the field should be displayed. It is passed the enclosing type (e.g the object type containing the localized fields, the field, and an array of the currently selected language ids. 
