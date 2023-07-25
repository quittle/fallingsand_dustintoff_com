mod color;
mod grain;
mod grid;
mod js;
mod texture;
mod utils;

use color::Color;
use console_error_panic_hook;
use grain::Grain;
use grid::{with_grid, CanvasSize, Grid, GridPos};

use js::{fill_rect, stroke_rect};
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn tick() {
    with_grid(|grid| {
        draw_border(grid);
        let cell_size = grid.cell_size();
        for ((x, y), grain) in &grid.cells {
            fill_rect(
                x * cell_size,
                y * cell_size,
                cell_size,
                cell_size,
                Color::from(grain.texture().into()).into(),
            );
        }
    });
}

#[wasm_bindgen]
pub fn on_click(canvas_x: CanvasSize, canvas_y: CanvasSize) {
    with_grid(|grid| {
        let cell_size = grid.cell_size();
        let x = canvas_x / cell_size;
        let y = canvas_y / cell_size;
        grid.add(x, y, Grain::Sand);
    });
}

#[wasm_bindgen]
pub fn init(rows: GridPos, cols: GridPos, canvas_width: CanvasSize, canvas_height: CanvasSize) {
    console_error_panic_hook::set_once();

    with_grid(|grid| {
        grid.resize(rows, cols, canvas_width, canvas_height);
        draw_border(grid);
        // let cell_size = grid.cell_size();
        // for r in 0..rows {
        //     for c in 0..cols {
        //         if (r + c) % 2 == 0 {
        //             drawRect(c * cell_size, r * cell_size, cell_size, cell_size);
        //         }
        //     }
        // }
    });
}

fn draw_border(grid: &Grid) {
    stroke_rect(
        1,
        1,
        grid.cols * grid.cell_size() - 1,
        grid.rows * grid.cell_size() - 1,
        Color::BLACK.into(),
    );
}

#[wasm_bindgen]
pub fn on_canvas_resize(canvas_width: CanvasSize, canvas_height: CanvasSize) {
    with_grid(|grid| {
        grid.resize(grid.rows, grid.cols, canvas_width, canvas_height);
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
