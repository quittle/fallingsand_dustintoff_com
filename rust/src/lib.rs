mod grain;
mod grid;
mod js;

use console_error_panic_hook;
use grid::{with_grid, CanvasSize, GridPos};

use js::drawRect;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn tick() {
    console_log!("Ticking!");
}

#[wasm_bindgen]
pub fn init(rows: GridPos, cols: GridPos, canvas_width: CanvasSize, canvas_height: CanvasSize) {
    console_error_panic_hook::set_once();

    let cell_size = canvas_width / cols;
    assert_eq!(
        cell_size,
        canvas_height / rows,
        "Num of cols and rows does not form a perfect grid"
    );
    let cell_size = cell_size * 5;
    with_grid(|grid| {
        grid.resize(rows, cols, canvas_width, canvas_height);
        for r in 0..rows {
            for c in 0..cols {
                if (r + c) % 2 == 0 {
                    drawRect(c * cell_size, r * cell_size, cell_size, cell_size);
                }
            }
        }
    });
}

#[wasm_bindgen]
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
