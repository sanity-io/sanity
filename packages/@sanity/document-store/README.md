# Document store

Sanity / gradient document store

## Example
```js
// If you are interested in everything that happens with document `lol42`
const subscription = documents.byId("lol42").subscribe(event => {
  console.log('Something happened with document lol42!', event)
})

// After a while, when you are no longer interested in updates fom document `lol42`:
subscription.unsubscribe()
```

## How it works
When you add a subscriber to a document the first thing that happens is that the subscriber function is called with a snapshot of the document's current state. This happens as soon as the snapshot is retrieved. If there is a cached version of it on the client, the snapshot is received immediately (synchronously).

From that moment on, you will receive a new event every time something happens to the document, until you unsubscribe again.

## API

- `createDocumentStore({serverConnection: ServerConnection}) : DocumentStore`

ServerConnection must be an object with the following api:
- `byId(id : string) : Observable<DocumentEvent>`
- `query(query : string) : Observable<QueryResultEvent>`
(todo, add more)

### DocumentStore

### Query methods
- `byId(id : string) : Observable<DocumentEvent>`
- `byIds(ids : Array<string>) : Observable<QueryResultEvent>`
- `query(query : string) : Observable<QueryResultEvent>`

### Mutation methods
- `update(id : string, spec : UpdateSpec) : Observable<OperationEvent>`
- `create(document : Document) : Observable<OperationEvent>`
- `replace(documentId : string, document : Document) : Observable<OperationEvent>`
- `createOrReplace(document : Document) : Observable<OperationEvent>`
- `delete(documentId : string) :  : Observable<OperationEvent>`

### Document
- `_id : string`
- `_type : string`

### DocumentEventType

### DocumentEvent
- `type : string` either one of `snapshot`, `update`
- `snapshot : Document`
