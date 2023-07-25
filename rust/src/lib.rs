mod color;
mod game;
mod grain;
mod grid;
mod js;
mod texture;
mod utils;

use game::with_game;
use grid::{CanvasSize, GridPos};

use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn tick(_delta: f64) {
    with_game(|game| {
        game.tick();
        game.draw();
    });
}

#[wasm_bindgen]
pub fn on_click(canvas_x: CanvasSize, canvas_y: CanvasSize) {
    with_game(|game| {
        game.on_click(canvas_x, canvas_y);
        game.draw();
    });
}

#[wasm_bindgen]
pub fn init(rows: GridPos, cols: GridPos, canvas_width: CanvasSize, canvas_height: CanvasSize) {
    console_error_panic_hook::set_once();

    with_game(|game| {
        game.init(rows, cols, canvas_width, canvas_height);
        game.draw();
    });
}

#[wasm_bindgen]
pub fn on_canvas_resize(canvas_width: CanvasSize, canvas_height: CanvasSize) {
    with_game(|game| {
        game.resize(canvas_width, canvas_height);
    });
}

#[macro_export]
macro_rules! static_assert {
    ($cond:expr) => {{
        const fn _static_assert() {
            assert!($cond);
        }

        const _: () = _static_assert();
    }};
}
