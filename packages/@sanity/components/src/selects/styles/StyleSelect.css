@import 'part:@sanity/base/theme/variables-style';

.root {
  display: block;
  outline: none;
  position: relative;

  @nest &:focus {
    box-shadow:
      0 0 2px 1px color(var(--input-border-color-focus)),
      0 0 4px 0 color(var(--input-border-color-focus) a(60%)),
      0 0 10px 5px color(var(--input-border-color-focus) a(10%));
  }
}

.inner {
  composes: root from 'part:@sanity/base/theme/forms/text-input-style';
  cursor: default;

  @nest .transparent & {
    transition: all 0.05s linear;
    background-color: transparent;
    border: 1px solid color(var(--gray-base) a(8%));

    @nest &:hover {
      background-color: var(--white);
      border-color: var(--gray-light);
    }
  }
}

.title {
  padding-right: 1em;
  color: var(--text-color);
}

.transparent:not(:hover) .inner {
  box-shadow: none;
}

.selectContainer {
  composes: selectContainer from 'part:@sanity/components/selects/default-style';
  display: flex;
}

.arrow {
  display: flex;
  align-items: center;
  padding-left: 0.5em;
  margin-left: auto;
}

.popper {
  composes: shadow-6dp from "part:@sanity/base/theme/shadows-style";
  box-sizing: border-box;
  background-color: var(--component-bg);
  position: relative;
  max-height: inherit;
  overflow: auto;
}

.list {
  margin: 0;
  padding: 0;
  display: block;
}

.item {
  composes: item from 'part:@sanity/base/theme/layout/selectable-style';
  position: relative;
  border-bottom: 1px solid var(--gray-light);
  white-space: nowrap;
  overflow: hidden;
  min-height: 2em;
  cursor: default;
  padding-right: 1em;
  color: inherit;

  &:last-child {
    border: 0;
  }
}

.itemContent {
  margin-left: 2em;
  padding: 0.5em 0;
}

.itemSelected {
  composes: item;
  background-color: var(--selected-item-color);
  color: var(--selected-item-color--inverted);

  @nest &:hover {
    background-color: var(--selected-item-color);
    color: var(--selected-item-color--inverted);
  }
}

.itemIcon {
  display: block;
  position: absolute;
  transform: translateY(-50%);
  top: 50%;
  left: 0.5em;
  font-size: 1em;
  width: 2em;
  overflow: hidden;
}
