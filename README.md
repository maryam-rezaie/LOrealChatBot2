# L’Oréal Routine Lab

This project upgrades the L'Oréal chatbot into a product-aware routine builder.
It loads real product data from `products.json`, lets users select products,
saves selections with `localStorage`, generates an AI routine, and supports
follow-up questions with conversation memory.

## Full rubric coverage

- Product cards select and unselect with visible feedback
- Selected products appear in a separate list and can be removed
- Clear-all button removes every saved selection
- Selections return after a page reload through `localStorage`
- Every product description is available through an expandable “Why it fits” section
- Product search filters by name, brand, category, description, or keyword
- Category and text search work together
- Generate Routine sends only selected product JSON to the AI
- Follow-up chat sends the full conversation history
- Cloudflare Worker protects the API key
- Optional live web search returns current information and citations
- RTL button changes the catalog, selection area, and chat direction
- Responsive desktop and mobile layout

## Important: keep the logo

Your existing project should contain:

```text
img/loreal-logo.png
```

This ZIP includes an `img` folder reminder, but not the course's logo image.
Keep or copy the original logo into that exact location.

## 1. Deploy the Cloudflare Worker

1. Open **Cloudflare → Workers & Pages**.
2. Create a Worker or open the Worker from the previous chatbot project.
3. Replace its code with `RESOURCE_cloudflare-worker.js`.
4. Go to **Settings → Variables and Secrets**.
5. Add a **Secret** named `OPENAI_API_KEY`.
6. Paste your OpenAI API key as the value and deploy.
7. Copy the Worker URL.

Never place the key in frontend code or GitHub.

## 2. Connect the site

Open `script.js` and replace:

```js
const WORKER_URL = "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";
```

with the deployed Worker URL.

## 3. Run locally

Use Codespaces Live Preview, Live Server, or another local web server. Do not
open `index.html` only as a `file://` page because browsers may block the
`products.json` request.

## 4. Test every rubric item

1. Search for `retinol` and confirm matching cards update immediately.
2. Choose a category and confirm it works together with the search field.
3. Select several cards and confirm their visual state and selected list.
4. Reload the page and confirm selections remain.
5. Remove one saved product and then test **Clear all**.
6. Open a product description using the Why it fits control.
7. Generate a routine and confirm every named product was selected.
8. Ask: `Which step should I use first and why?`
9. Ask an unrelated question and confirm the advisor politely refuses it.
10. Leave web search on and ask for current L'Oréal product information; check
    for clickable source links.
11. Switch to RTL and check the product grid, selected list, and chat.
12. Test desktop, tablet, mobile, and an incognito browser.

## Web-search fallback

The Worker first tries `gpt-5-search-api` when web search is enabled. If that
model is unavailable to the API account, it automatically retries with
`gpt-4.1`, so the required routine and chat features can still work. The app
shows a small notice when fallback occurs.
