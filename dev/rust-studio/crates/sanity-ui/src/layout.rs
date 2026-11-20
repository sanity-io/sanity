//! `Box`, `Flex`, `Stack`, `Inline` and `Grid`, with spacing on the `@sanity/ui` space scale.

use std::fmt::Write;

use leptos::prelude::*;

use crate::theme::{RADIUS, SPACE, rem};

pub fn space(index: usize) -> String {
    rem(SPACE[index.min(SPACE.len() - 1)] as f64)
}

pub fn radius(index: usize) -> String {
    if index >= RADIUS.len() { "9999px".into() } else { rem(RADIUS[index] as f64) }
}

/// Padding as indices into the space scale, like `padding`/`paddingX`/`paddingTop` in `@sanity/ui`.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Pad {
    pub top: usize,
    pub right: usize,
    pub bottom: usize,
    pub left: usize,
}

impl Pad {
    pub const fn all(p: usize) -> Self {
        Pad { top: p, right: p, bottom: p, left: p }
    }

    pub const fn xy(x: usize, y: usize) -> Self {
        Pad { top: y, right: x, bottom: y, left: x }
    }

    pub fn css(self) -> String {
        format!("padding: {} {} {} {};", space(self.top), space(self.right), space(self.bottom), space(self.left))
    }
}

impl From<usize> for Pad {
    fn from(p: usize) -> Self {
        Pad::all(p)
    }
}

impl From<(usize, usize)> for Pad {
    fn from((x, y): (usize, usize)) -> Self {
        Pad::xy(x, y)
    }
}

impl From<[usize; 4]> for Pad {
    fn from([top, right, bottom, left]: [usize; 4]) -> Self {
        Pad { top, right, bottom, left }
    }
}

/// The layout props every primitive shares.
#[derive(Default)]
pub(crate) struct Layout {
    pub padding: Option<Pad>,
    pub flex: Option<u32>,
    pub overflow: Option<&'static str>,
    pub height: Option<&'static str>,
    pub style: Option<String>,
}

impl Layout {
    pub fn css(&self) -> String {
        let mut out = String::new();
        if let Some(padding) = self.padding {
            out.push_str(&padding.css());
        }
        if let Some(flex) = self.flex {
            let _ = write!(out, "flex: {flex}; min-width: 0;");
        }
        if let Some(overflow) = self.overflow {
            let _ = write!(out, "overflow: {overflow};");
        }
        match self.height {
            Some("fill") => out.push_str("height: 100%;"),
            Some("stretch") => out.push_str("min-height: 100%;"),
            Some(height) => {
                let _ = write!(out, "height: {height};");
            }
            None => {}
        }
        if let Some(style) = &self.style {
            out.push_str(style);
        }
        out
    }
}

#[component]
pub fn Box(
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional)] flex: Option<u32>,
    #[prop(optional)] overflow: Option<&'static str>,
    #[prop(optional)] height: Option<&'static str>,
    #[prop(optional, into)] style: Option<String>,
    #[prop(optional)] children: Option<Children>,
) -> impl IntoView {
    let style = Layout { padding, flex, overflow, height, style }.css();
    view! { <div data-ui="Box" style=style>{children.map(|children| children())}</div> }
}

#[component]
pub fn Flex(
    #[prop(optional)] direction: Option<&'static str>,
    #[prop(optional)] align: Option<&'static str>,
    #[prop(optional)] justify: Option<&'static str>,
    #[prop(optional)] gap: Option<usize>,
    #[prop(optional)] wrap: bool,
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional)] flex: Option<u32>,
    #[prop(optional)] overflow: Option<&'static str>,
    #[prop(optional)] height: Option<&'static str>,
    #[prop(optional, into)] style: Option<String>,
    children: Children,
) -> impl IntoView {
    let mut css = String::from("display: flex;");
    if let Some(direction) = direction {
        let _ = write!(css, "flex-direction: {direction};");
    }
    if let Some(align) = align {
        let _ = write!(css, "align-items: {align};");
    }
    if let Some(justify) = justify {
        let _ = write!(css, "justify-content: {justify};");
    }
    if let Some(gap) = gap {
        let _ = write!(css, "gap: {};", space(gap));
    }
    if wrap {
        css.push_str("flex-wrap: wrap;");
    }
    css.push_str(&Layout { padding, flex, overflow, height, style }.css());
    view! { <div data-ui="Flex" style=css>{children()}</div> }
}

#[component]
pub fn Stack(
    #[prop(optional)] space: Option<usize>,
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional)] flex: Option<u32>,
    #[prop(optional)] overflow: Option<&'static str>,
    #[prop(optional)] height: Option<&'static str>,
    #[prop(optional, into)] style: Option<String>,
    children: Children,
) -> impl IntoView {
    let mut css = String::from("display: grid; grid-template-columns: minmax(0, 1fr); grid-auto-rows: min-content;");
    if let Some(gap) = space {
        let _ = write!(css, "gap: {};", self::space(gap));
    }
    css.push_str(&Layout { padding, flex, overflow, height, style }.css());
    view! { <div data-ui="Stack" style=css>{children()}</div> }
}

#[component]
pub fn Inline(
    #[prop(optional)] space: Option<usize>,
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional, into)] style: Option<String>,
    children: Children,
) -> impl IntoView {
    let mut css = String::from("display: flex; flex-wrap: wrap; align-items: center;");
    if let Some(gap) = space {
        let _ = write!(css, "gap: {};", self::space(gap));
    }
    css.push_str(&Layout { padding, style, ..Layout::default() }.css());
    view! { <div data-ui="Inline" style=css>{children()}</div> }
}

#[component]
pub fn Grid(
    columns: usize,
    #[prop(optional)] gap: Option<usize>,
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional, into)] style: Option<String>,
    children: Children,
) -> impl IntoView {
    let mut css = format!("display: grid; grid-template-columns: repeat({columns}, minmax(0, 1fr));");
    if let Some(gap) = gap {
        let _ = write!(css, "gap: {};", space(gap));
    }
    css.push_str(&Layout { padding, style, ..Layout::default() }.css());
    view! { <div data-ui="Grid" style=css>{children()}</div> }
}
