# Differs

There needs to be two kinds of differs:
1. Summary Differs: These can be handed down to the diff algorithm. These decide what the edit summaries coming back from differ contains. At the moment, I can't see the perfect use-case for overriding these yet, need to research some more
2. Visual Differs: These control how the change is rendered. Will be useful in all sorts of cases

# bateson.js

## Questions

What's up with both the global and local contect/ctx? The local context (the one passed to the recursive diff algo) isn't mutated, so I'm thinking rename the global one to options (assembled outside) then pass it as context to the first diff call. Then have the diff algo only used the local instance

## Bugs

That early return while evaluating `object` makes the next line unreachable

`extractText` should probably not join spans using whitespace, because you can have spans inside a word


## Defaults operations

`modifyField` - something on this field has changeed
`editText` - a string (or text in block) has changed
`replace` - object type has changed
`remove` - a value has been removed
`set` - a value has appeared where there was none
`modifyEntry` - an entry in an array (with the given key) has changed
`edit` - a plain value (number, booelan, null/undefined) has changed

## Custom
`replaceImage` - image asset reference has changed



# Next up

When you write your own summaryDiffer for a type, are you expected to handle _all_ operations for that type? I think it would be best if we fall back to the default if some edge case isn't handled. But, I'm not clear on how the differ would communicate to bateson that "yeah, there is a differ for this type, but not for this particular operation"

Should both summaryDiffers and visualDiffers be defined on the schema? Or do the appear via the part system?

- [x] barebones whole wood setup
- [x] separate summaryDiffers
- [x] separate visualDiffers
- [x] rename operation `textEdit` --> `editText`
- [x] add `_id` to ignore-fields and ensure it doesn't bork
- [x] visual differs should return an object `{coponent: MyComponent, otherFlag: true}`
- [ ] the visualizer needs both documents as well
- [ ] summaryDiffers return null if type is handled but not that particular case
- [ ] verify primitives work
- [ ] make image changes appear
- [ ] chunk info about a deeply nested single change
- [ ] block text, first pass
- [ ] arrays, first pass
- [ ] use input component (or list-previews) in default visualDiffer
- [ ] figure out if differ definitions should be loaded via the schema or part system




