- Change patch format to match gradient
- Show validation errors
- Factor out css modules (provide as separate export, maybe)
- Implement configurable widgets, e.g. map marker, reference picker
- Focus handling is currently only implemented for String input
- References:

Gradient currently stores references as:
```
"author": {
  "_ref": "bookstore:40303"
}
```
where the type

- Define a schema on inputs