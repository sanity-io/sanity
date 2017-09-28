1. The constraints are wrong when backfilling.

If you're sorting by `_updatedAt`, it currently just does a greater than/less than check:

```
*[
  _type == $type &&
  _updatedAt <= "2017-08-24T12:00:00Z" &&
  _id < "product-070"
] | order(_updatedAt asc, _id desc) [0...1]
```

Should be:
```
*[
  _type == $type &&
  (
    _updatedAt < "2017-08-24T12:00:00Z" || (
      _updatedAt == "2017-08-24T12:00:00Z" &&
      _id < "product-070"
    )
  )
] | order(_updatedAt asc, _id desc) [0...1]
```

Also, when multiple orderings are provided, how do we handle that? If you order by `price` and `_updatedAt` and you want to fetch the element directly prior to the following document:

```
{
  _id: "product-070",
  _updatedAt: "2017-08-24T12:00:00Z",
  price: 200
}
```

Your query would be:
<DONT KNOW>


2. The whole idea of basically prefixing everything with `_`to mark it as private seems hacky and unncessary. Should probably change the whole thing to a function that returns an event emitter and keep the functions as simple functions within scope.

3. There is no "assumed list size" logic to prevent constantly trying to backfill at end of data set. We should keep track of this when fetching snapshot and backfills, remembering that added and removed items (from mutations) change this count. Also, until we have history support for listeners, we should probably get rid of the assumed count every time the listener disconnects.


