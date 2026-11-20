//! `Text`, `Heading`, `Label`, `Code`, `Kbd` and `Icon`.

use leptos::prelude::*;
pub use sanity_icons::Icon as IconName;

use crate::styles::{FontKind, font_class, kbd_class};
use crate::theme::FontWeight;

#[allow(clippy::too_many_arguments)]
fn typography(
    kind: FontKind,
    tag: &'static str,
    size: usize,
    weight: FontWeight,
    muted: bool,
    accent: bool,
    ellipsis: bool,
    align: Option<&'static str>,
    children: Children,
) -> AnyView {
    let class = font_class(kind, size, weight);
    let ui = match kind {
        FontKind::Text => "Text",
        FontKind::Label => "Label",
        FontKind::Heading => "Heading",
        FontKind::Code => "Code",
    };
    if tag == "pre" {
        return view! { <pre data-ui=ui class=class><code>{children()}</code></pre> }.into_any();
    }
    view! {
        <div
            data-ui=ui
            class=class
            data-muted=muted.then_some("")
            data-accent=accent.then_some("")
            data-ellipsis=ellipsis.then_some("")
            data-align=align
        >
            <span>{children()}</span>
        </div>
    }
    .into_any()
}

#[component]
pub fn Text(
    #[prop(optional)] size: Option<usize>,
    #[prop(optional)] weight: Option<FontWeight>,
    #[prop(optional)] muted: bool,
    #[prop(optional)] accent: bool,
    #[prop(optional)] ellipsis: bool,
    #[prop(optional)] align: Option<&'static str>,
    children: Children,
) -> impl IntoView {
    typography(
        FontKind::Text,
        "div",
        size.unwrap_or(2),
        weight.unwrap_or(FontWeight::Regular),
        muted,
        accent,
        ellipsis,
        align,
        children,
    )
}

#[component]
pub fn Heading(
    #[prop(optional)] size: Option<usize>,
    #[prop(optional)] weight: Option<FontWeight>,
    #[prop(optional)] muted: bool,
    #[prop(optional)] ellipsis: bool,
    children: Children,
) -> impl IntoView {
    typography(
        FontKind::Heading,
        "div",
        size.unwrap_or(2),
        weight.unwrap_or(FontWeight::Bold),
        muted,
        false,
        ellipsis,
        None,
        children,
    )
}

#[component]
pub fn Label(
    #[prop(optional)] size: Option<usize>,
    #[prop(optional)] weight: Option<FontWeight>,
    #[prop(optional)] muted: bool,
    children: Children,
) -> impl IntoView {
    typography(
        FontKind::Label,
        "div",
        size.unwrap_or(2),
        weight.unwrap_or(FontWeight::Semibold),
        muted,
        false,
        false,
        None,
        children,
    )
}

#[component]
pub fn Code(#[prop(optional)] size: Option<usize>, children: Children) -> impl IntoView {
    typography(FontKind::Code, "pre", size.unwrap_or(2), FontWeight::Regular, false, false, false, None, children)
}

#[component]
pub fn Kbd(children: Children) -> impl IntoView {
    view! {
        <kbd data-ui="KBD" class=kbd_class() style="padding: 0.0625rem 0.25rem;">
            <span class=font_class(FontKind::Text, 0, FontWeight::Semibold)><span>{children()}</span></span>
        </kbd>
    }
}

/// An `@sanity/icons` icon, sized `1em` and colored by the surrounding text.
#[component]
pub fn Icon(icon: IconName, #[prop(optional, into)] style: Option<String>) -> impl IntoView {
    view! {
        <svg
            data-sanity-icon=icon.name()
            width="1em"
            height="1em"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style=style
            inner_html=icon.inner()
        ></svg>
    }
}
