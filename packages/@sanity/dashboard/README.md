# Dashboard

Tool which picks up and renders any widgets implementing `part:@sanity/dashboard/widget`. Install this plugin in your Content Studio to display stats about your project, number of edits last 24 hours, etc.

The Dashboard tool has been designed to be as generic as possible, making few assumptions about its widgets. The Dashboard itself is mostly concerned about the layout of the configured widgets.

## How to install a widget

## How to create a widget

## How to configure the Dashboard

Override `part:@sanity/dashboard/config` in your Studio to take control of what appears on the dashboard.

A widget’s size behavior can be defined using the `layout` configuration, e.g.:

```js
export default {
  widgets: [{name: 'project-info', layout: {width: 'medium', height: 'auto'}}]
}
```
