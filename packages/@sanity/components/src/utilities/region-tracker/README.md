# Overlay-reporter

A React utility component for tracking regions of components
relative to a common parent

## Usage
```jsx
function Regions({regions}) {
    return regions.map((region, i) => <div style={{position: 'absolute', top: region.rect.top}}></div>)
}

<Regionally renderWith={Regions} >

...subtree

</Regionally>
```
