# Real Estate Content Generator

AI-powered property listing content generator. Generates headlines, MLS descriptions, and social media posts for LinkedIn, Facebook, and Instagram.

## Tech stack

- **Next.js 14** (React frontend + API routes)
- **Anthropic Claude** (via secure server-side API route)
- **Vercel** (hosting)

The API key is stored as a Vercel environment variable — it never reaches the browser.

---

## Deploy to Vercel (step by step)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create real-estate-generator --public --push
# or push to an existing repo
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your GitHub repo
3. Leave the framework setting as **Next.js** (auto-detected)
4. Before clicking Deploy, open **Environment Variables**
5. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from [console.anthropic.com](https://console.anthropic.com)
6. Click **Deploy**

That's it — Vercel handles the build and your key stays secure on the server.

---

## Local development

```bash
npm install

# Create your local env file
cp .env.example .env.local
# Edit .env.local and add your real ANTHROPIC_API_KEY

npm run dev
# Open http://localhost:3000
```

---

## How the security works

- The browser calls `/api/generate` (your own Next.js route)
- That route runs **server-side on Vercel** and calls Anthropic using `process.env.ANTHROPIC_API_KEY`
- The API key is **never included in any JavaScript sent to the browser**
- `.env.local` is in `.gitignore` so it's never committed
