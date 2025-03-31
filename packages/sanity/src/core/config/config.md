## Define config:

It takes a config object, which could include any of the following properties

- [WorkspaceOptions](./types.ts#L453)
- [SourceOptions](./types.ts#L504)
- [PluginOptions](./types.ts#L355):

### Unknowns:

What's the diff between a Source and a Workspace?

### Takeaways:

- config.document.[option]. composable are similar but different

  - documentId and schemaType seems the common denominator, schemaType in some cases is of type Schema in others is string.
    SchemaType seems to be called documentType in others.

- `unstable_sources` seems to be leaking to user land, but should it be there?

- Wrap official plugins into a `features` object?
  - tasks, releases, scheduledPublishing
  - Comments it's part of config.document, move it into features?
  - Add ConfigContext to this functions allowing users to have a callback to enable or disable, this would solve the changes introduced by this PR from user config land https://github.com/sanity-io/sanity/pull/9001

This config options are placed in the plugins options, this means, any plugin users are inserting could modify the values, I think they make more sense in the WorkspaceOptions definition, meaning the the workspace will be in control of them

- search

  ```
  {
    unstable_partialIndexing?: { enabled: boolean }
    strategy?: "groqLegacy" | "groq2024"
    enableLegacySearch?: boolean
  }
  ```

- beta

  ```
    {
      treeArrayEditing?: {enabled: boolean} // @deprecated, remove this.
      create?: {
        startInCreateEnabled: boolean
        fallbackStudioOrigin?: string
      }
      eventsAPI?: {
        documents?: boolean
        releases?: boolean
      }
    }
  ```

- announcements
  ```
    {
      enabled: boolean
    }
  ```

From Saskia:
Templates need to have access to the language.
new document options don't have access to a callback.
Context are different depending on where you are, validation has more things than readOnly or hidden. 
 - readOnly takes an async function, hidden doesn't
 - optionsList would be great to have an async callback.
 
- deprecated array members are still shown in the dropdowns, they need to be removed or make it possible to hide them from the dropdowns.

Add to the ConfigContext

- workspace name
- releaseId
- versionType


Async:
 - hidden
 - readonly
 - templates
 - new document options



Schemas:

- add release to the schema callbacks, e.g. disable slug fields in documents in releases.
- readOnly not going to the fields in the correct way if mutated

```ts
 export const DisableOnReleasesSlugField(props){
   const {selectedReleaseId} = usePerspective()
   return props.renderDefault({
     ...props,
     // Investigate why this doesn't work
     readOnly: Boolean(selectedReleaseId)
   })

 }
```

 - preview -> select -> prepare is different to everything else


  fields: [
    {
    type: "myCustomObject",
    readOnly: ["myCustomObject.a", "myCustomObject.a"]
  }
]

```ts
type Config = {}
```


Some linear tickets:
- https://linear.app/sanity/issue/SAPP-1795/support-for-conditional-hidden-for-object-fields-declared-from-the