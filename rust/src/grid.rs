use std::{
    cell::RefCell,
    cmp::{max, min},
    collections::HashMap,
    mem::size_of,
};

use crate::static_assert;

use super::grain::Grain;

thread_local! {
    pub static GRID: RefCell<Grid> = RefCell::new(Grid::new());
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
    cells: HashMap<(GridPos, GridPos), Grain>,
}

impl Grid {
    pub fn new() -> Self {
        Self {
            rows: 0,
            cols: 0,
            canvas_width: 0,
            canvas_height: 0,
            cells: HashMap::new(),
        }
    }

    pub fn resize(
        &mut self,
        rows: GridPos,
        cols: GridPos,
        canvas_width: CanvasSize,
        canvas_height: CanvasSize,
    ) {
        // Prune hidden cells when shrinking
        if self.rows < rows || self.cols < cols {
            self.cells.retain(|(x, y), _| *x < cols && *y < rows);
        }

        self.rows = rows;
        self.cols = cols;
        self.canvas_width = canvas_width;
        self.canvas_height = canvas_height;
    }

    pub fn cell_size(&self) -> CanvasSize {
        static_assert!(size_of::<CanvasSize>() >= size_of::<CanvasSize>());

        max(
            1,
            min(
                self.canvas_width / self.cols,
                self.canvas_height / self.rows,
            ),
        )
    }

    /// Inserts a grain at the position if not already set. Returns true if the grain was newly inserted
    pub fn add(&mut self, x: GridPos, y: GridPos, grain: Grain) -> bool {
        if x >= self.rows || y >= self.cols {
            return false;
        }

        let pos = (x, y);
        if self.cells.contains_key(&pos) {
            return false;
        }

        self.cells.insert(pos, grain);
        true
    }

    pub fn cells(&self) -> impl Iterator<Item = (&(GridPos, GridPos), &Grain)> {
        self.cells.iter()
    }
}
