use std::cell::RefCell;

use super::grain::Grain;

thread_local! {
    pub static GRID: RefCell<Grid> = const { RefCell::new(Grid::new()) };
}

pub fn with_grid<T, F: FnOnce(&mut Grid) -> T>(func: F) -> T {
    GRID.with(|grid| {
        let mut grid = grid.borrow_mut();
        func(&mut grid)
    })
}

pub type GridPos = u16;
pub type CanvasSize = u16;

#[derive(Default)]
pub struct Grid {
    pub rows: GridPos,
    pub cols: GridPos,
    pub canvas_width: CanvasSize,
    pub canvas_height: CanvasSize,
    pub cells: Vec<Grain>,
}

impl Grid {
    pub const fn new() -> Self {
        Self {
            rows: 0,
            cols: 0,
            canvas_width: 0,
            canvas_height: 0,
            cells: vec![],
        }
    }

    pub fn resize(
        &mut self,
        rows: GridPos,
        cols: GridPos,
        canvas_width: CanvasSize,
        canvas_height: CanvasSize,
    ) {
        self.rows = rows;
        self.cols = cols;
        self.canvas_width = canvas_width;
        self.canvas_height = canvas_height;
    }
}
