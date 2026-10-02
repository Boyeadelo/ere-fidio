import assert from "node:assert/strict";
import test from "node:test";
import { addProductToCart, CART_KEY, formatNaira, platformName, readCart } from "../src/lib/store";

test("formats kobo as Nigerian naira", () => {
  assert.equal(formatNaira(8_500_000), "₦85,000");
});

test("uses shopper-facing platform names", () => {
  assert.equal(platformName("PS5"), "PlayStation 5");
  assert.equal(platformName("PS4"), "PlayStation 4");
  assert.equal(platformName("Xbox"), "Xbox");
});

test("cart additions respect available stock", () => {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  Object.assign(globalThis, { window: { localStorage, dispatchEvent: () => true } });
  const product = { id: "game-1", title: "A game", platform: "PS5" as const, price_kobo: 100_000, description: "", stock: 2, image_url: null };
  addProductToCart(product, 1);
  addProductToCart(product, 5);
  assert.equal(readCart()[0]?.quantity, 2);
  assert.ok(values.has(CART_KEY));
});
