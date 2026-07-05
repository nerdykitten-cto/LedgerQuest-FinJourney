import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end coverage for LedgerQuest (localStorage build, no Firebase).
 * Covers the full finance->RPG loop plus the Phase 3 feature surfaces:
 * War Room recruit/dismiss, Savings Vaults, the Engine Log trace viewer,
 * and New Ritual habit creation. Selectors match the real UI; the AP
 * counter is read via the data-testid hook because it renders as split spans.
 */

const ap = (page: Page) => page.getByTestId('ap-value');
const game = (page: Page) => page.getByTestId('adventure-world');

async function freshStart(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(ap(page)).toHaveText('10');
}

async function logExpense(page: Page, amount: string, note: string) {
  await page.getByRole('button', { name: /Scribe Expense/i }).click();
  await page.locator('input[placeholder="0.00"]').fill(amount);
  await page.locator('input[placeholder="Describe the golden flow..."]').fill(note);
  await page.getByRole('button', { name: /COMMIT TO LEDGER/i }).click();
}

function tab(page: Page, name: string) {
  // Nav tab labels are uppercased via CSS; the accessible name keeps its
  // original casing ("Quests", "Trials", ...). Match case-insensitively.
  return page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') });
}

// Enter the town the party is currently standing on (a double-click on the
// active map node). The scene reads two onClick events <350ms apart, so we
// leave a beat between clicks for React to commit the first click's state.
async function enterCurrentTown(page: Page) {
  const node = () => game(page).getByText('Starting Village', { exact: true });
  const outskirts = game(page).getByText(/To The Outskirts/i);
  // The scene reads two clicks <350ms apart as "enter town". Playwright's
  // per-click overhead makes a single fixed delay fragile, so poll: each pass
  // leaves lastClickTime fresh, and successive clicks converge into the window.
  for (let i = 0; i < 8; i++) {
    if (await outskirts.count()) break;
    await node().click();
    await page.waitForTimeout(90);
    await node().click();
    await page.waitForTimeout(250);
  }
  await expect(outskirts).toBeVisible({ timeout: 5000 });
}

// Click STRIKE until the party wins and the quest turns claimable.
async function winCombat(page: Page) {
  await expect(game(page).getByText('COMBAT INTERFACE')).toBeVisible();
  const claim = page.getByRole('button', { name: /Claim Rewards/i });
  for (let i = 0; i < 40; i++) {
    if (await claim.count()) break;
    const strike = game(page).getByRole('button', { name: 'STRIKE', exact: true }).first();
    if ((await strike.count()) && (await strike.isEnabled().catch(() => false))) {
      await strike.click().catch(() => {});
    }
    await page.waitForTimeout(400);
  }
  await expect(claim).toBeVisible({ timeout: 10000 });
}

test.describe('LedgerQuest — core loop', () => {
  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('full loop: expense -> embark -> town -> talk -> combat -> claim', async ({ page }) => {
    // Expense converts spending into Action Points (+8 AP).
    await logExpense(page, '50', 'Tavern provisions');
    await expect(ap(page)).toHaveText('18');

    // Open the Strategic Map.
    await tab(page, 'QUESTS').click();

    // Embark on the main quest through the Royal Writ gate (apQuota 5).
    const questCard = page.locator('div.tape-accent', { hasText: 'The Ledger of the Lost Town' });
    await questCard.getByRole('button', { name: /Accept/i }).click();
    await page.getByRole('button', { name: /EMBARK ON QUEST/i }).click();
    await expect(ap(page)).toHaveText('13');

    // Entering the current town is free.
    await enterCurrentTown(page);
    await expect(ap(page)).toHaveText('13');

    // Talk to the objective NPC — completes the "talk" objective.
    await game(page).getByText('Chronicler Daniel').click();
    await expect(game(page).getByText(/Welcome, scribe/i)).toBeVisible();
    await game(page).getByText(/Click to dismiss/i).click();

    // Head to the Outskirts and start combat.
    await game(page).getByText(/To The Outskirts/i).click();
    await game(page).getByText(/Hunt For Gold/i).click();
    await expect(game(page).getByText('DEBT GNOME')).toBeVisible();
    await expect(game(page).getByText('INVENTORY:')).toBeVisible();

    // Win, then claim the quest reward.
    await winCombat(page);
    await page.getByRole('button', { name: /Claim Rewards/i }).click();
    await expect(page.getByRole('button', { name: /Claim Rewards/i })).toHaveCount(0);
  });

  test('travel between towns is distance-based (tuned divisor)', async ({ page }) => {
    // One logged expense (+8) comfortably funds an adjacent hop (7 AP).
    await logExpense(page, '20', 'Road rations');
    await expect(ap(page)).toHaveText('18');
    await tab(page, 'QUESTS').click();
    await game(page).getByText('Copper Town', { exact: true }).click();
    await expect(ap(page)).toHaveText('11'); // 18 - 7
  });
});

test.describe('LedgerQuest — Phase 3 features', () => {
  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('New Ritual creates a habit', async ({ page }) => {
    await tab(page, 'TRIALS').click();
    await page.getByRole('button', { name: /New Ritual/i }).click();
    await page.getByPlaceholder('Ritual name...').fill('Morning Budgeting');
    await page.getByRole('button', { name: /Seal Ritual/i }).click();
    await expect(page.getByRole('heading', { name: 'Morning Budgeting' })).toBeVisible();
  });

  test('Vaults: deposit, forge, and reset', async ({ page }) => {
    await tab(page, 'ARCHIVE').click();
    await page.getByRole('button', { name: 'Vaults', exact: true }).click();

    // Seeded vault starts at $12,400.
    const summerCabin = page.locator('div.group', { hasText: 'Vault: Summer Cabin' });
    await expect(summerCabin).toContainText('$12,400');

    // Deposit $600 -> $13,000.
    await page.getByPlaceholder('Amount').fill('600');
    await page.getByRole('button', { name: 'Deposit', exact: true }).click();
    await expect(summerCabin).toContainText('$13,000');

    // Forge a new vault (default target).
    await page.getByPlaceholder('Vault name').fill('Emergency Fund');
    await page.getByRole('button', { name: /Forge Vault/i }).click();
    await expect(page.getByText('Vault: Emergency Fund')).toBeVisible();

    // Reset wipes everything and reseeds the world.
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /Reset Adventure/i }).click();
    await expect(page.getByText('Vault: Emergency Fund')).toHaveCount(0);
    await expect(page.locator('div.group', { hasText: 'Vault: Summer Cabin' })).toContainText('$12,400');
  });

  test('Engine Log shows Game Director traces', async ({ page }) => {
    // Generate director activity, then read the trace viewer.
    await logExpense(page, '30', 'Ledger warmup');
    await tab(page, 'ARCHIVE').click();
    await page.getByRole('button', { name: 'Engine Log', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Engine Log' })).toBeVisible();
    await expect(page.getByText(/The Director has made no decisions yet/i)).toHaveCount(0);
    // Each trace card carries the observe/infer/decide breakdown.
    await expect(page.getByText('Observe').first()).toBeVisible();
  });

  test('War Room: dismiss a member then recruit a replacement', async ({ page }) => {
    // Put the party in a town with gold so recruiting is allowed.
    await page.evaluate(() => {
      localStorage.setItem('player/stats', JSON.stringify({ level: 2, exp: 0, ap: 20, gold: 500 }));
      localStorage.setItem('player/campaign', JSON.stringify({ currentLocation: 'Starting Village', progressPercentage: 0, worldState: 'town' }));
      window.dispatchEvent(new Event('storage'));
    });

    await tab(page, 'QUESTS').click();
    await page.getByRole('button', { name: /War Room/i }).click();
    await expect(page.getByRole('heading', { name: /War Room: Tactical Formation/i })).toBeVisible();

    // Dismiss the Lightweaver (a support member, not the leader).
    const liaCard = page.locator('.group', { hasText: 'Lia' });
    await liaCard.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.locator('.group', { hasText: 'Lia' })).toHaveCount(0);

    // A support slot opens; recruit a replacement (town + 500 gold).
    const recruit = page.getByText('Recruit Support');
    await expect(recruit).toBeVisible();
    await recruit.click();

    // Party is back to a full support row — the recruit slot is gone.
    await expect(page.getByText('Recruit Support')).toHaveCount(0);
  });
});
