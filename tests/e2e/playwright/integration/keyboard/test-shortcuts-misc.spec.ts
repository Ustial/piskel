import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  getPrimaryColor,
  clickTool,
  drawAtPixel,
  openSaveSettingsPanel,
  isSettingsDrawerExpanded,
  waitFor,
  wait,
} from "../../testutils";

test.describe('Keyboard shortcuts — zoom', () => {

  async function getZoom(page: Page): Promise<number> {
    return await page.evaluate(() =>
      window.pskl.app.drawingController.compositeRenderer.getZoom()
    );
  }

  test('"+" should increase zoom', async ({ page }) => {
    await openEditor(page);
    const before = await getZoom(page);

    await page.keyboard.press('+');
    await wait(200);

    expect(await getZoom(page)).toBeGreaterThan(before);
  });

  test('"-" should decrease zoom', async ({ page }) => {
    await openEditor(page);

    // Zoom in first
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('+');
      await wait(100);
    }
    const before = await getZoom(page);

    await page.keyboard.press('-');
    await wait(200);

    expect(await getZoom(page)).toBeLessThan(before);
  });

  test('"0" should reset zoom', async ({ page }) => {
    await openEditor(page);
    const initial = await getZoom(page);

    // Zoom in
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('+');
      await wait(100);
    }
    expect(await getZoom(page)).toBeGreaterThan(initial);

    // Reset
    await page.keyboard.press('0');
    await waitFor(async () => Math.abs(await getZoom(page) - initial) < 1);
  });
});

test.describe('Keyboard shortcuts — palette color select', () => {

  test('"1"-"3" should select different palette colors', async ({ page }) => {
    await openEditor(page);

    // Set a grid with 3 distinct colors so the palette has entries
    await setPiskelFromGrid(page, [['R', 'G', 'B', 'T']]);
    // Draw a pixel to trigger palette refresh via TOOL_RELEASED
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 3, 0);
    await wait(500);

    // Key "1" selects first palette color
    await page.keyboard.press('1');
    await wait(200);
    const color1 = (await getPrimaryColor(page)).toLowerCase();

    // Key "2" selects second palette color
    await page.keyboard.press('2');
    await wait(200);
    const color2 = (await getPrimaryColor(page)).toLowerCase();

    // They should be different
    expect(color1).not.toBe(color2);

    // Key "1" again should go back to first
    await page.keyboard.press('1');
    await wait(200);
    expect((await getPrimaryColor(page)).toLowerCase()).toBe(color1);
  });
});

test.describe('Keyboard shortcuts — save', () => {

  test('Ctrl+S should save and clear dirty indicator', async ({ page }) => {
    await openEditor(page);

    // Make canvas dirty
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitFor(async () => (await page.locator('.piskel-name').innerText()).includes('*'));

    // Ctrl+S should save
    await page.keyboard.press('Control+s');
    await waitFor(async () => !(await page.locator('.piskel-name').innerText()).includes('*'));

    expect(await page.locator('.piskel-name').innerText()).not.toContain('*');
  });
});

test.describe('Keyboard shortcuts — ESC', () => {

  test('ESC should close an open dialog', async ({ page }) => {
    await openEditor(page);

    // Open cheatsheet dialog
    await page.keyboard.press('?');
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached();

    // ESC should close it
    await page.keyboard.press('Escape');
    await waitFor(async () => (await page.locator('#dialog-container-wrapper.show').count()) === 0);
  });

  test('ESC should close settings drawer', async ({ page }) => {
    await openEditor(page);

    await openSaveSettingsPanel(page);
    expect(await isSettingsDrawerExpanded(page)).toBe(true);

    await page.keyboard.press('Escape');
    await waitFor(async () => !(await isSettingsDrawerExpanded(page)));

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
  });
});
