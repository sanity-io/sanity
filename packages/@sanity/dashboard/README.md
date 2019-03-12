# Dashboard

Dashboard is a Tool which picks up and renders any widgets implementing `part:@sanity/dashboard/widget`. Install this plugin in your Content Studio to display stats about your project, number of edits last 24 hours, etc.

The Dashboard tool has been designed to be as generic as possible, making few assumptions about its widgets. The Dashboard itself is mostly concerned about the layout of the configured widgets.

## Install

- `cd` to your Content Studio
- Type `sanity install @sanity/dashboard`. This will cause two things happen:
  1. The Dashboard tool gets installed to `./node_modules` in your Studio
  2. `@sanity/dashboard` is appended to the `plugins` array in the `sanity.json` file of your Studio
- To verify that all is well, fire up your Studio (`sanity start`) and point your browser to `http://localhost:3333/dashboard`
- \o/

## How to configure the Dashboard

Changing what is rendered on your Dashboard is easy. To take control, do the following:

1. Implement your own dashboardConfig. In your `sanity.json` file, append the following line to the `parts` array:

```json
{
  "implements": "part:@sanity/dashboard/config",
  "path": "src/dashboardConfig.js"
}
```

2. Create the file `src/dashboardConfig.js` and make sure it's shaped something like this:

```javascript
export default {
  widgets: [{name: 'sanity-tutorials'}, {name: 'project-info'}, {name: 'project-users'}]
}
```

The `widgets` array is how you tell the Dashboard which widgets to render. The ones mentioned in the above example are bundled with Sanity and require no separate installation.

3. Restart your Studio and play around with the order of the widgets array in `src/dashboardConfig.js`. You can also duplicate them, should you want multiple instances of the same widget (see below).

A widget’s size behavior can be defined by adding a `layout` key to a the widget config. E.g.: `{name: 'project-users', layout: {width: 'full', height: 'small'}}`. Accepted values are `auto`, `small`, `medium`, `large` and `full`.

## How to install a widget

Install a Dashboard widget as you would any other [Sanity Studio plugin](https://www.sanity.io/docs/plugins).

E.g. if you want to install the cats example widget mentioned below, just type `sanity install dashboard-widget-cats` (this works because it's published on npm under the name `sanity-plugin-dashboard-widget-cats`) and update your `src/dashboardConfig.js` file by adding `{name: 'cats'}` to the `widgets` array. Poof, you've got 🐱 in your Studio.

Some widgets allow options to change aspects of their behavior. If you install the document-list widget mentioned below, it can be configured with:

```js
{name: 'document-list', options: {title: 'Last edited books', order: '_updatedAt desc', types: ['book']}}
```

## How to create a widget

Widgets are Sanity plugins which implement the part `part:@sanity/dashboard/widget`. Stay tuned for a complete "Widget Authors Cookbook", but until then, have a look at some sample widgets: E.g. [A document List](https://github.com/sanity-io/dashboard-widget-document-list/tree/master) or [maybe some cats](https://github.com/sanity-io/example-dashboard-widget-cats)?

---
