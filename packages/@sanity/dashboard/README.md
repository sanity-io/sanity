# Dashboard

Dashboard is a Sanity Content Studio Tool which picks up and renders any widgets which implement `part:@sanity/dashboard/widget`. Install this plugin in your Studio to display stats about your project, recently edited documents, etc.

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

```js
export default {
  widgets: [{name: 'sanity-tutorials'}, {name: 'project-info'}, {name: 'project-users'}]
}
```

The `widgets` array is how you tell the Dashboard which widgets to render. The ones mentioned in the above example are bundled with Sanity and require no separate installation.

3. Restart your Studio and play around with the order of the widgets array in `src/dashboardConfig.js`. You can also duplicate them, should you want multiple instances of the same widget (see below).

A widget’s size behavior can be defined by adding a `layout` key to a the widget config. E.g.: `{name: 'project-users', layout: {width: 'full', height: 'small'}}`. Accepted values are `auto`, `small`, `medium`, `large` and `full`.

## How to install a widget

Install a Dashboard widget as you would any other [Sanity Studio plugin](https://www.sanity.io/docs/extending/plugins).

E.g. if you want to install the cats example widget mentioned below, proceed as follows:

1. Type `sanity install dashboard-widget-cats` in your terminal (this works because it's published on npm under the name `sanity-plugin-dashboard-widget-cats`)
2. Update your `src/dashboardConfig.js` file by adding `{name: 'cats'}` to the `widgets` array
3. You've got 🐱 in your Studio

Some widgets allow options to change aspects of their behavior. If you install the document-list widget mentioned below, it can be configured with:

```js
{name: 'document-list', options: {title: 'Last edited books', order: '_updatedAt desc', types: ['book']}}
```

Thus, if you want your dashboard to display both newest documents across all document types and another widget showing the last edited books, your dashboardConfig would look like this:

```js
export default {
  widgets: [
    {name: 'document-list', options: {title: 'New', order: '_createdAt desc'}},
    {
      name: 'document-list',
      options: {title: 'Last edited books', order: '_updatedAt desc', types: ['book']}
    }
  ]
}
```

## How to create a widget

Widgets are Sanity plugins which implement the part `part:@sanity/dashboard/widget`. Stay tuned for a complete "Widget Authors Cookbook", but until then, have a look at some sample widgets: E.g. [A document List](https://github.com/sanity-io/dashboard-widget-document-list/tree/master) or [maybe some cats](https://github.com/sanity-io/example-dashboard-widget-cats)?

When writing your widget components, it's recommended to use the styles defined in `./src/widgets.css` for your basic building blocks:

```
@import 'part:@sanity/base/theme/variables-style';

.container {
  composes: container from 'part:@sanity/dashboard/widget-styles';
}

.containerWithPadding {
  composes: containerWithPadding from 'part:@sanity/dashboard/widget-styles';
}

.header {
  composes: header from "part:@sanity/dashboard/widget-styles";
}

.title {
  composes: title from 'part:@sanity/dashboard/widget-styles';
}

.buttonContainer {
  composes: bottomButtonContainer from 'part:@sanity/dashboard/widget-styles';
}
```

Your widget root element should aways be wrapped with the `container` style from `part:@sanity/dashboard/widget-styles`

---
