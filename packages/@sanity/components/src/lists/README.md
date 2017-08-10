

# Usage

## Regular list

```js
import React from 'react'
import {List, Item} from 'part:@sanity/components/lists/default'

function renderItem(item, index) {
  return (
    <Item className="myListItem">
      {item}
    </Item>
    )
}

function MyComponent() {
  return (
    <List
     className="myList"
     items={['a', 'b', 'c']}
     renderItem={renderItem}
    />
  )
}
```

## Sortable list

```jsx
import {List, Item, DragHandle} from 'part:@sanity/components/lists/sortable'

<List className="myList">
  <ListItem>
    <DragHandle />
    Hello this is sortable list item
  </ListItem>
</List>
```

## Grid list

```jsx
import {List, Item} from 'part:@sanity/components/lists/grid'

<List className="myGridList">
  <ListItem>
    Hello this is grid list item #1
  </ListItem>
  <ListItem>
    Hello this is grid list item #2
  </ListItem>
  <ListItem>
    Hello this is grid list item #3
  </ListItem>
</List>
```

## Sortable grid list

```jsx
import {List, Item} from 'part:@sanity/components/lists/sortable-grid'

<List className="myGridList">
  <ListItem>
    <DragHandle />
    Hello this is sortable grid list item #1
  </ListItem>
  <ListItem>
    <DragHandle />
    Hello this is sortable grid list item #2
  </ListItem>
  <ListItem>
    <DragHandle />
    Hello this is sortable grid list item #3
  </ListItem>
</List>
```

# Custom drag handle
To create a custom drag handle, you can import the custom `createDragHandle` function. This works for both regular sortable lists and sortable grid lists.

```jsx
import {List, ListItem, createDragHandle} from 'part:@sanity/components/lists/sortable'

const MyDragHandle = createDragHandle(<span>Drag me!</span>

<List className="myGridList">
  <ListItem>
    <MyDragHandle />
    Hello this is sortable list item #1
  </ListItem>
  <ListItem>
    <MyDragHandle />
    Hello this is sortable list item #2
  </ListItem>
  <ListItem>
    <MyDragHandle />
    Hello this is sortable list item #3
  </ListItem>
</List>
```
