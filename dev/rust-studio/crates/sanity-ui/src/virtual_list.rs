//! A windowed list with fixed row heights: only the rows in view (plus `overscan`) are in the DOM,
//! however long the list is.

use std::hash::Hash;
use std::sync::Arc;

use leptos::ev;
use leptos::html;
use leptos::prelude::*;

#[derive(Clone, Copy, Debug, PartialEq)]
struct Viewport {
    scroll_top: f64,
    height: f64,
}

/// The rows to render for a scroll position: `[start, end)`.
pub fn visible_range(len: usize, row_height: f64, scroll_top: f64, height: f64, overscan: usize) -> (usize, usize) {
    if len == 0 || row_height <= 0.0 {
        return (0, 0);
    }
    let first = (scroll_top / row_height).floor().max(0.0) as usize;
    let count = (height / row_height).ceil() as usize + 1;
    let start = first.saturating_sub(overscan).min(len);
    let end = (first + count + overscan).min(len);
    (start, end)
}

/// Renders `items` in a scroll container that fills its parent. `on_end_reached` is called when
/// the last rendered row comes within `overscan` rows of the end, for paging. A row re-renders
/// only when its key changes, so the key should change with the row's content.
#[component]
pub fn VirtualList<T, K, KF>(
    #[prop(into)] items: Signal<Arc<Vec<T>>>,
    row_height: f64,
    key: KF,
    render: Callback<(usize, T), AnyView>,
    #[prop(optional)] overscan: Option<usize>,
    #[prop(optional, into)] on_end_reached: Option<Callback<()>>,
    /// Called with the rendered `[start, end)` whenever it changes, eg to fetch those rows.
    #[prop(optional, into)]
    on_range: Option<Callback<(usize, usize)>>,
    #[prop(optional, into)] scroll_to_top: Option<Signal<u64>>,
) -> impl IntoView
where
    T: Clone + Send + Sync + 'static,
    K: Eq + Hash + Clone + Send + Sync + 'static,
    KF: Fn(&T) -> K + Clone + Send + Sync + 'static,
{
    let overscan = overscan.unwrap_or(8);
    let container = NodeRef::<html::Div>::new();
    let viewport = RwSignal::new(Viewport { scroll_top: 0.0, height: 800.0 });

    let measure = move || {
        if let Some(element) = container.get_untracked() {
            let next = Viewport { scroll_top: element.scroll_top() as f64, height: element.client_height() as f64 };
            if viewport.get_untracked() != next {
                viewport.set(next);
            }
        }
    };
    Effect::new(move |_| {
        if container.get().is_some() {
            measure();
        }
    });
    let resize = window_event_listener(ev::resize, move |_| measure());
    on_cleanup(move || resize.remove());

    if let Some(scroll_to_top) = scroll_to_top {
        Effect::new(move |previous: Option<u64>| {
            let current = scroll_to_top.get();
            if previous.is_some_and(|previous| previous != current)
                && let Some(element) = container.get_untracked()
            {
                element.set_scroll_top(0);
            }
            current
        });
    }

    let range = Memo::new(move |_| {
        let viewport = viewport.get();
        visible_range(items.with(|items| items.len()), row_height, viewport.scroll_top, viewport.height, overscan)
    });

    if let Some(on_range) = on_range {
        Effect::new(move |_| on_range.run(range.get()));
    }

    if let Some(on_end_reached) = on_end_reached {
        Effect::new(move |_| {
            let (_, end) = range.get();
            let len = items.with(|items| items.len());
            if len > 0 && end + overscan >= len {
                on_end_reached.run(());
            }
        });
    }

    let rows = move || {
        let (start, end) = range.get();
        items.with(|items| (start..end).map(|index| (index, items[index].clone())).collect::<Vec<_>>())
    };
    let total = move || {
        format!("position: relative; width: 100%; height: {}px;", items.with(|items| items.len()) as f64 * row_height)
    };

    view! {
        <div
            node_ref=container
            data-ui="VirtualList"
            style="height: 100%; overflow-y: auto; overflow-anchor: none; contain: strict;"
            on:scroll=move |_| measure()
        >
            <div style=total>
                <For
                    each=rows
                    key=move |(index, item)| (key(item), *index)
                    children=move |(index, item)| {
                        let style = format!(
                            "position: absolute; left: 0; right: 0; top: 0; height: {row_height}px; transform: translateY({}px);",
                            index as f64 * row_height,
                        );
                        view! { <div style=style>{render.run((index, item))}</div> }
                    }
                />
            </div>
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::visible_range;

    #[test]
    fn renders_the_window_plus_overscan() {
        assert_eq!(visible_range(0, 50.0, 0.0, 500.0, 5), (0, 0));
        assert_eq!(visible_range(1000, 50.0, 0.0, 500.0, 5), (0, 16));
        assert_eq!(visible_range(1000, 50.0, 5000.0, 500.0, 5), (95, 116));
        assert_eq!(visible_range(1000, 50.0, 49_900.0, 500.0, 5), (993, 1000));
        assert_eq!(visible_range(3, 50.0, 0.0, 500.0, 5), (0, 3));
    }
}
