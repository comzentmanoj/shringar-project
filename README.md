# Shringar — Home Page UI Update

## What changed

1. **Hero → auto-sliding product carousel.** Instead of one static image, the hero now
   cycles through your first 5 featured products (name, category, price, WhatsApp CTA),
   auto-advancing every 4.5s. Dots at the bottom-right let visitors jump to a slide
   manually and reset the auto-timer.
2. **New "Shop by Category" section** directly below the hero, with a fixed set of
   circular category tiles. Clicking one navigates to `/category/:slug`.
3. **New Category page** (`/category/:categoryName`) — a dedicated URL per category
   that filters your existing product list client-side and displays it in the same
   product-grid style as the home page. No backend/API changes needed.
4. **Refactor for reuse:** header, footer, and the product-grid card styles were pulled
   out of `home.component.scss` into shared files so the new Category page doesn't
   duplicate CSS, and any future page gets them for free.

## Where each file goes (paths relative to `src/`)

```
styles.scss                                  → replaces src/styles.scss
app/app.routes.ts                            → replaces src/app/app.routes.ts
app/shared/styles/_product-grid.scss         → NEW file
app/pages/home/home.component.ts             → replaces existing
app/pages/home/home.component.html           → replaces existing
app/pages/home/home.component.scss           → replaces existing
app/pages/category/category.component.ts     → NEW file
app/pages/category/category.component.html   → NEW file
app/pages/category/category.component.scss   → NEW file
```

## One thing to edit: the category list

In `home.component.ts`, edit the `categories` array to match your real categories.
The `slug` must be the lowercase, hyphenated form of whatever you store in each
product's `category` field, since the Category page matches on that:

```ts
categories: CategoryTile[] = [
  { name: 'Earrings', slug: 'earrings', image: '...' },
  { name: 'Necklaces', slug: 'necklaces', image: '...' },
  // add/remove/rename freely
];
```

Example: a product with `category: "Maang Tikka"` is matched by the slug
`maang-tikka` — so the tile would be:
`{ name: 'Maang Tikka', slug: 'maang-tikka', image: '...' }`.

Swap the placeholder Unsplash `image` URLs for your own product/category photos
whenever you're ready.

## Notes

- The hero carousel gracefully falls back to the original static copy/image if
  there are fewer than 1 featured products (e.g. while loading or if the API call fails).
- The Category page reuses `ProductService.getAll()` — it doesn't hit a new endpoint,
  it just filters the same product list you already fetch on the home page.
- If a category has zero matching products, the page shows a friendly empty state
  instead of erroring.