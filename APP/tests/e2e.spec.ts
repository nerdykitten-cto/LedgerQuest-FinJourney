import { test, expect } from '@playwright/test';

test.describe('LedgerQuest RPG Inventory & E2E Loop', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Launch the application
    await page.goto('/');
    
    // 2. Clear storage to start clean
    await page.evaluate(() => localStorage.clear());
    
    // 3. Reload page to initialize fresh database state
    await page.reload();
  });

  test('should complete the entire finance-to-RPG game loop successfully', async ({ page }) => {
    // --- STEP 1: Finance Office (Expense Logging & AP conversion) ---
    // Start with 10 AP
    await expect(page.locator('text=10 AP')).toBeVisible();

    // Click "Scribe Expense" button to open expense logger
    const scribeBtn = page.getByRole('button', { name: /Scribe Expense/i });
    await expect(scribeBtn).toBeVisible();
    await scribeBtn.click();

    // Fill the expense form
    const amountInput = page.locator('input[placeholder="0.00"]');
    await amountInput.fill('50');

    const descInput = page.locator('input[placeholder="Describe the golden flow..."]');
    await descInput.fill('Tavern provisions');

    // Submit form
    const commitBtn = page.getByRole('button', { name: /Commit to Ledger/i });
    await commitBtn.click();

    // Verify AP updates to 18 (+8 AP: 5 base + 3 bonus for staying under budget)
    await expect(page.locator('text=18 AP')).toBeVisible();

    // --- STEP 2: Navigation to Quests & Opening Vault ---
    // Click "Quests" tab
    const questsTab = page.getByRole('button', { name: /Quests/i });
    await questsTab.click();

    // Open "Vault"
    const vaultBtn = page.getByRole('button', { name: /Vault/i });
    await vaultBtn.click();

    // Verify Vault title is visible
    await expect(page.locator('text=The Grand Vault: Inventory')).toBeVisible();

    // Verify starter items exist in the vault
    await expect(page.locator('text=Budget Slicer')).toBeVisible();
    await expect(page.locator('text=Health Potion')).toBeVisible();

    // Close vault modal
    const closeVaultBtn = page.locator('button:has-text("close")');
    await closeVaultBtn.first().click();

    // --- STEP 3: Map Navigation & Entering Town ---
    // Double click "Starting Village" node to enter town
    const villageNode = page.locator('text=Starting Village');
    await villageNode.dblclick();

    // Verify we entered the town and see Town Square
    await expect(page.locator('text=Town Square')).toBeVisible();
    await expect(page.locator('text=Chronicler Daniel')).toBeVisible();

    // --- STEP 4: Armory Shop Inspection ---
    // Click on "General Store"
    const storeGate = page.locator('text=General Store');
    await storeGate.click();

    // Verify Armory store is visible and shows items
    await expect(page.locator('text=Town Armory')).toBeVisible();
    await expect(page.locator('text=Iron Sword')).toBeVisible();
    await expect(page.locator('text=Leather Tunic')).toBeVisible();

    // Close store
    const closeStoreBtn = page.locator('button:has-text("close")');
    await closeStoreBtn.first().click();

    // --- STEP 5: Outskirts Exploration & Combat ---
    // Navigate to outskirts
    const outskirtsBtn = page.locator('text=To The Outskirts');
    await outskirtsBtn.click();

    // Engage in combat
    const huntBtn = page.getByRole('button', { name: /Hunt For Gold/i });
    await huntBtn.click();

    // Verify combat scene is loaded
    await expect(page.locator('text=Critical Incursion')).toBeVisible();
    await expect(page.locator('text=Debt Gnome')).toBeVisible();
    await expect(page.locator('text=Heal Potions:')).toBeVisible();

    // Attack the enemy with Vanguard "Althea"
    const strikeBtn = page.locator('div:has-text("Althea") >> button:has-text("STRIKE")');
    await expect(strikeBtn).toBeVisible();
    await strikeBtn.click();

    // Verify that AP decreases (18 AP -> 17 AP) and log output reflects the strike
    await expect(page.locator('text=17 AP')).toBeVisible();
    await expect(page.locator('p:has-text("STRIKE:")')).toBeVisible();
  });
});
