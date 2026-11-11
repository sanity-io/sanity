//! `ThemeProvider` and `Card`: the color scheme and card tone that everything below is styled in.

use leptos::ev::MouseEvent;
use leptos::prelude::*;

use crate::layout::{Layout, Pad, radius};
use crate::styles::{card_base_class, card_class, global_styles, shadow};
use crate::theme::{CardTone, Scheme};

#[derive(Clone, Copy)]
struct SchemeContext(Signal<Scheme>);

#[derive(Clone, Copy)]
struct ToneContext(CardTone);

pub fn use_scheme() -> Signal<Scheme> {
    use_context::<SchemeContext>().map_or_else(|| Signal::stored(Scheme::Light), |context| context.0)
}

pub fn use_card_tone() -> CardTone {
    use_context::<ToneContext>().map_or(CardTone::Default, |context| context.0)
}

/// Installs the global styles and the color scheme, and renders the root card.
#[component]
pub fn ThemeProvider(#[prop(into)] scheme: Signal<Scheme>, children: Children) -> impl IntoView {
    global_styles();
    provide_context(SchemeContext(scheme));
    provide_context(ToneContext(CardTone::Default));
    let class = move || format!("{} {}", card_base_class(), card_class(scheme.get(), CardTone::Default));
    view! {
        <div data-ui="Card" class=class style="height: 100%;">
            {children()}
        </div>
    }
}

/// `Card` with `as` limited to `div`, `button` and `a`, which is what the studio needs.
#[component]
pub fn Card(
    #[prop(optional)] tone: Option<CardTone>,
    #[prop(optional)] scheme: Option<Scheme>,
    #[prop(optional)] as_: Option<&'static str>,
    #[prop(optional, into)] href: MaybeProp<String>,
    #[prop(optional, into)] selected: Signal<bool>,
    #[prop(optional, into)] pressed: Signal<bool>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional)] muted: bool,
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional)] radius: Option<usize>,
    #[prop(optional)] shadow: Option<usize>,
    #[prop(optional)] border: bool,
    #[prop(optional)] border_top: bool,
    #[prop(optional)] border_bottom: bool,
    #[prop(optional)] border_left: bool,
    #[prop(optional)] border_right: bool,
    #[prop(optional)] flex: Option<u32>,
    #[prop(optional)] overflow: Option<&'static str>,
    #[prop(optional)] height: Option<&'static str>,
    #[prop(optional, into)] style: Option<String>,
    #[prop(optional, into)] title: MaybeProp<String>,
    #[prop(optional, into)] on_click: Option<Callback<MouseEvent>>,
    #[prop(optional)] children: Option<Children>,
) -> impl IntoView {
    let tone = tone.unwrap_or_else(use_card_tone);
    let scheme = match scheme {
        Some(scheme) => {
            provide_context(SchemeContext(Signal::stored(scheme)));
            Signal::stored(scheme)
        }
        None => use_scheme(),
    };
    provide_context(ToneContext(tone));

    let mut css = Layout { padding, flex, overflow, height, style }.css();
    if let Some(index) = radius {
        css.push_str(&format!("border-radius: {};", self::radius(index)));
    }
    if let Some(elevation) = shadow {
        css.push_str(&format!("box-shadow: {};", self::shadow(elevation)));
    }
    for (enabled, side) in [
        (border, "border"),
        (border_top, "border-top"),
        (border_bottom, "border-bottom"),
        (border_left, "border-left"),
        (border_right, "border-right"),
    ] {
        if enabled {
            css.push_str(&format!("{side}: 1px solid var(--card-border-color);"));
        }
    }

    let class = move || format!("{} {}", card_base_class(), card_class(scheme.get(), tone));
    let flag = |signal: Signal<bool>| move || signal.get().then_some("");
    let click = move |event: MouseEvent| {
        if let Some(on_click) = on_click {
            on_click.run(event);
        }
    };
    let children = children.map(|children| children());

    match as_ {
        Some("button") => view! {
            <button
                type="button"
                data-ui="Card"
                data-as="button"
                class=class
                style=css
                title=move || title.get()
                disabled=move || disabled.get()
                data-selected=flag(selected)
                data-pressed=flag(pressed)
                on:click=click
            >
                {children}
            </button>
        }
        .into_any(),
        Some("a") => view! {
            <a
                data-ui="Card"
                data-as="a"
                class=class
                style=css
                title=move || title.get()
                href=move || href.get()
                data-selected=flag(selected)
                data-pressed=flag(pressed)
                data-disabled=flag(disabled)
                on:click=click
            >
                {children}
            </a>
        }
        .into_any(),
        _ => view! {
            <div
                data-ui="Card"
                class=class
                style=css
                title=move || title.get()
                data-muted=muted.then_some("")
                on:click=click
            >
                {children}
            </div>
        }
        .into_any(),
    }
}
