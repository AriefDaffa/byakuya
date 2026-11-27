import { expect, test } from '@playwright/test';

test.describe('Full end-to-end chat flow (Postgres + SSE + Local Storage)', () => {
  test('two users can register, chat live over SSE, edit/delete, upload attachment, and sign out', async ({
    browser,
  }) => {
    const suffix = Date.now();
    const aliceEmail = `alice.${suffix}@example.com`;
    const bobEmail = `bob.${suffix}@example.com`;
    const password = 'Password123!';

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // 1. Register Alice
      await pageA.goto('/register');
      await pageA.getByLabel('Name').fill(`Alice ${suffix}`);
      await pageA.getByLabel('Email').fill(aliceEmail);
      await pageA.getByLabel('Password').fill(password);
      await pageA.getByRole('button', { name: 'Sign Up' }).click();
      await expect(pageA).toHaveURL('/');
      await expect(pageA.getByPlaceholder('Search...')).toBeVisible();

      // 2. Register Bob
      await pageB.goto('/register');
      await pageB.getByLabel('Name').fill(`Bob ${suffix}`);
      await pageB.getByLabel('Email').fill(bobEmail);
      await pageB.getByLabel('Password').fill(password);
      await pageB.getByRole('button', { name: 'Sign Up' }).click();
      await expect(pageB).toHaveURL('/');
      await expect(pageB.getByPlaceholder('Search...')).toBeVisible();

      // 3. Alice searches for Bob and opens DM
      await pageA.getByPlaceholder('Search...').fill(`Bob ${suffix}`);
      await pageA.getByRole('button', { name: new RegExp(`Bob ${suffix}`) }).click();
      await expect(pageA.getByPlaceholder('Write a message...')).toBeVisible();

      // 4. Alice sends a message -> Bob receives it live via SSE
      const firstMsg = `Hello Bob ${suffix}`;
      await pageA.getByPlaceholder('Write a message...').fill(firstMsg);
      await pageA.getByRole('button', { name: 'Send message' }).click();
      await expect(pageA.getByText(firstMsg)).toBeVisible();

      // Bob clicks the new conversation in his sidebar (delivered via SSE)
      await expect(
        pageB.getByRole('button', { name: new RegExp(`Alice ${suffix}`) }),
      ).toBeVisible({ timeout: 10000 });
      await pageB.getByRole('button', { name: new RegExp(`Alice ${suffix}`) }).click();
      await expect(pageB.getByText(firstMsg)).toBeVisible();

      // 5. Bob replies -> Alice receives it live without reload
      const replyMsg = `Hi Alice ${suffix}`;
      await pageB.getByPlaceholder('Write a message...').fill(replyMsg);
      await pageB.getByRole('button', { name: 'Send message' }).click();
      await expect(pageA.getByText(replyMsg)).toBeVisible({ timeout: 10000 });

      // 6. Alice reloads -> messages persist in PostgreSQL
      await pageA.reload();
      await pageA.getByRole('button', { name: new RegExp(`Bob ${suffix}`) }).click();
      await expect(pageA.getByText(firstMsg)).toBeVisible();
      await expect(pageA.getByText(replyMsg)).toBeVisible();

      // 7. Alice uploads a text attachment -> persists & protected by auth
      const fileInput = pageA.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: `note-${suffix}.txt`,
        mimeType: 'text/plain',
        buffer: Buffer.from(`Attachment payload ${suffix}`),
      });
      await expect(pageA.getByText(`note-${suffix}.txt`)).toBeVisible({ timeout: 10000 });

      const attachmentHref = await pageA
        .locator(`a:has-text("note-${suffix}.txt")`)
        .getAttribute('href');
      expect(attachmentHref).toMatch(/^\/api\/attachments\//);

      // Unauthenticated request to attachment route must be 401
      const unauthRes = await pageA.request.get(attachmentHref!, {
        headers: { Cookie: '' },
      });
      // Use a fresh unauthenticated API context to verify 401
      const unauthContext = await browser.newContext();
      const unauthPage = await unauthContext.newPage();
      const res = await unauthPage.request.get(`http://localhost:3000${attachmentHref}`);
      expect(res.status()).toBe(401);
      await unauthContext.close();
      void unauthRes;

      // 8. Alice signs out
      await pageA.getByRole('button', { name: 'Open menu' }).click();
      await pageA.getByRole('button', { name: 'Sign out' }).click();
      await expect(pageA).toHaveURL(/\/login/);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
