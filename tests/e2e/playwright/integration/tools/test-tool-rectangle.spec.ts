import test, { expect, Page } from "@playwright/test";
import {
  clickTool,
  openEditor,
  readPixelGrid,
  setPiskelFromGrid,
} from "../../testutils";

/** Drag from sprite pixel (x1,y1) to (x2,y2) */
async function dragBetweenPixels(page: Page, x1: number, y1: number, x2: number, y2: number) {
  const start = await page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: x1, row: y1 });
  const end = await page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: x2, row: y2 });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

/** Create an NxN transparent TestGrid */
function emptyTestGrid(size = 10): ("T")[][] {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

test.describe('Rectangle tool', () => {

  test('rectangle tool: draws hollow outline', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-rectangle');

    await dragBetweenPixels(page, 1, 1, 8, 8);

    const grid = await readPixelGrid(page, 10, 10);

    const expected = [
      '..........',  // row 0
      '.XXXXXXXX.',  // row 1: top edge
      '.X......X.',  // row 2
      '.X......X.',  // row 3
      '.X......X.',  // row 4
      '.X......X.',  // row 5
      '.X......X.',  // row 6
      '.X......X.',  // row 7
      '.XXXXXXXX.',  // row 8: bottom edge
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('rectangle tool + Shift: constrains to square', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-rectangle');

    // Drag from (1,1) to (8,5) with Shift — should constrain to a square (1,1)→(5,5)
    const start = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 1, row: 1 });
    const end = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 8, row: 5 });

    await page.keyboard.down('Shift');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Shift');

    const grid = await readPixelGrid(page, 10, 10);

    const expected = [
      '..........',
      '.XXXXX....',
      '.X...X....',
      '.X...X....',
      '.X...X....',
      '.XXXXX....',
      '..........',
      '..........',
      '..........',
      '..........',
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });
});
