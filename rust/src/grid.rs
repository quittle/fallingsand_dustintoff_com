use std::{
    cmp::{max, min},
    collections::HashMap,
    mem::size_of,
};

use crate::static_assert;

use super::grain::Grain;

pub type GridPos = u16;
pub type CanvasSize = u16;

#[derive(Default)]
pub struct Grid {
    pub rows: GridPos,
    pub cols: GridPos,
    pub canvas_width: CanvasSize,
    pub canvas_height: CanvasSize,
    state_first: bool,
    cells: HashMap<(GridPos, GridPos), (Grain, Grain)>,
}

#[allow(dead_code)]
impl Grid {
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

        self.cells.insert(pos, (grain, grain));
        true
    }

    pub fn set(&mut self, x: GridPos, y: GridPos, grain: Grain) {
        if x >= self.rows || y >= self.cols {
            return;
        }

        let pos = (x, y);
        if let Some(entries) = self.cells.get_mut(&pos) {
            if self.state_first {
                entries.1 = grain;
            } else {
                entries.0 = grain;
            }
        } else if !matches!(grain, Grain::Empty) {
            self.cells.insert(pos, self.new_next_grain_pair(grain));
        }
    }

    pub fn clear(&mut self, x: GridPos, y: GridPos) {
        self.set(x, y, Grain::Empty);
    }

    fn new_next_grain_pair(&self, grain: Grain) -> (Grain, Grain) {
        if self.state_first {
            (Grain::Empty, grain)
        } else {
            (grain, Grain::Empty)
        }
    }

    pub fn is_empty(&self, x: GridPos, y: GridPos) -> bool {
        if let Some((a, b)) = self.cells.get(&(x, y)) {
            if self.state_first {
                matches!(a, Grain::Empty)
            } else {
                matches!(b, Grain::Empty)
            }
        } else {
            true
        }
    }

    pub fn cur_cells(&self) -> impl Iterator<Item = (&(GridPos, GridPos), &Grain)> {
        self.cells
            .iter()
            .map(|(pos, (a, b))| (pos, if self.state_first { a } else { b }))
    }

    pub fn cells(&self) -> impl Iterator<Item = ((GridPos, GridPos), (Grain, Grain))> + '_ {
        self.cells
            .iter()
            .map(|(pos, (a, b))| (*pos, if self.state_first { (*a, *b) } else { (*b, *a) }))
    }

    pub fn flip(&mut self) {
        self.state_first = !self.state_first;
    }
}
