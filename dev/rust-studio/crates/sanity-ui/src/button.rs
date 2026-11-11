//! `Button`, with the defaults of the studio's `ui-components/button` wrapper (padding 2, gap 2).

use leptos::ev::MouseEvent;
use leptos::prelude::*;

use crate::card::{use_card_tone, use_scheme};
use crate::layout::{Pad, radius, space};
use crate::styles::{FontKind, button_base_class, button_class, font_class};
use crate::text::{Icon, IconName};
use crate::theme::{ButtonMode, FontWeight, StateTone};

#[component]
pub fn Button(
    #[prop(optional, into)] text: MaybeProp<String>,
    #[prop(optional)] icon: Option<IconName>,
    #[prop(optional)] icon_right: Option<IconName>,
    #[prop(optional)] mode: Option<ButtonMode>,
    #[prop(optional)] tone: Option<StateTone>,
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional)] font_size: Option<usize>,
    #[prop(optional)] radius: Option<usize>,
    #[prop(optional)] gap: Option<usize>,
    #[prop(optional)] justify: Option<&'static str>,
    #[prop(optional)] fill: bool,
    #[prop(optional, into)] selected: Signal<bool>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional, into)] loading: Signal<bool>,
    #[prop(optional, into)] title: MaybeProp<String>,
    #[prop(optional)] submit: bool,
    /// Renders a link instead of a `<button>`.
    #[prop(optional, into)]
    href: Option<Signal<String>>,
    #[prop(optional)] target: Option<&'static str>,
    #[prop(optional, into)] on_click: Option<Callback<MouseEvent>>,
) -> impl IntoView {
    let scheme = use_scheme();
    let card_tone = use_card_tone();
    let mode = mode.unwrap_or(ButtonMode::Default);
    let tone = tone.unwrap_or(StateTone::Default);
    let font_size = font_size.unwrap_or(1);
    let padding = padding.unwrap_or(Pad::all(2));
    let class = move || format!("{} {}", button_base_class(), button_class(scheme.get(), card_tone, mode, tone));
    let style = format!("border-radius: {};", self::radius(radius.unwrap_or(2)));
    let inner_style = format!(
        "display: flex; gap: {}; justify-content: {}; align-items: center;",
        space(gap.unwrap_or(2)),
        justify.unwrap_or("center")
    );
    let has_text = move || text.get().is_some_and(|text| !text.is_empty());
    let text_class = font_class(FontKind::Text, font_size, FontWeight::Medium);
    let icon_class = font_class(FontKind::Text, font_size, FontWeight::Regular);
    let icon_class_right = icon_class.clone();
    let text_style = if icon_right.is_some() { "flex: 1; min-width: 0;" } else { "min-width: 0;" }.to_owned();

    let click = move |event: MouseEvent| {
        if let Some(on_click) = on_click {
            on_click.run(event);
        }
    };
    let content = view! {
        <span style=padding.css()>
            <span style=inner_style>
                {icon.map(|icon| view! { <span class=icon_class.clone()><span><Icon icon=icon /></span></span> })}
                <Show when=has_text>
                    <span class=text_class.clone() data-ellipsis="" style=text_style.clone()>
                        <span>{move || text.get()}</span>
                    </span>
                </Show>
                {icon_right
                    .map(|icon| view! { <span class=icon_class_right.clone()><span><Icon icon=icon /></span></span> })}
            </span>
        </span>
        <Show when=move || loading.get()>
            <span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background-color: var(--card-bg-color); border-radius: inherit;">
                <crate::misc::Spinner />
            </span>
        </Show>
    };

    match href {
        Some(href) => view! {
            <a
                data-ui="Button"
                href=move || href.get()
                target=target
                rel=target.map(|_| "noreferrer")
                class=class
                style=format!("{style} text-decoration: none;")
                data-width=fill.then_some("fill")
                data-selected=move || selected.get().then_some("")
                title=move || title.get()
                on:click=click
            >
                {content}
            </a>
        }
        .into_any(),
        None => view! {
            <button
                data-ui="Button"
                type=if submit { "submit" } else { "button" }
                class=class
                style=style
                data-width=fill.then_some("fill")
                data-selected=move || selected.get().then_some("")
                data-disabled=move || disabled.get().then_some("true")
                disabled=move || disabled.get()
                title=move || title.get()
                on:click=click
            >
                {content}
            </button>
        }
        .into_any(),
    }
}
