# 🌸 LenaMiu — Step-by-Step Setup Guide (Beginner Friendly)

---

## What you will have at the end
- Your LenaMiu gallery running as a real website
- Visitors can **watch videos** but **cannot see your source code** (it gets scrambled/minified when you build)
- The site is protected by a secret link — only people with your QR code can enter

---

## PART 1 — Install the Tools (do this once)

### Step 1 — Install Node.js

1. Go to **https://nodejs.org**
2. Click the big green **"LTS"** button and download it
3. Open the downloaded file and click through the installer (just keep clicking Next/Continue)
4. When it's done, **restart your computer**

To check it worked, open VS Code → press **Ctrl+`** (backtick, the key left of 1) to open the terminal, then type:
```
node --version
```
You should see something like `v20.x.x` — that's good! ✅

---

### Step 2 — Install VS Code (if you don't have it)

Download from **https://code.visualstudio.com** — it's free.

---

## PART 2 — Set Up Your Project

### Step 3 — Open the lenamiu folder in VS Code

1. Copy the **lenamiu** folder (that came with this guide) somewhere easy to find, like your Desktop
2. Open VS Code
3. Click **File → Open Folder** → select the **lenamiu** folder
4. You should now see these files on the left:
   ```
   lenamiu/
   ├── src/
   │   ├── App.jsx       ← your main site code
   │   ├── App.css       ← all the styling
   │   ├── main.jsx      ← entry point (don't touch)
   │   └── index.css     ← tiny global reset
   ├── index.html
   ├── package.json
   └── vite.config.js
   ```

---

### Step 4 — Install project packages

In VS Code, open the terminal (**Ctrl+`**) and type:
```
npm install
```
Wait for it to finish. You'll see a `node_modules` folder appear. That's normal — don't touch it.

---

### Step 5 — Run your site locally (test on your own computer)

In the terminal, type:
```
npm run dev
```

You'll see something like:
```
  ➜  Local:   http://localhost:5173/
```

Open that link in your browser. You'll see the **lock screen** — that's correct!

To unlock the site, add `#lenamiu2025` to the end of the URL:
```
http://localhost:5173/#lenamiu2025
```

Now you can see the full gallery! 🎉

To **stop** the server, press **Ctrl+C** in the terminal.

---

### Step 6 — Change your secret password (optional but recommended)

Open **src/App.jsx** in VS Code.

At the very top, find:
```javascript
const SECRET = 'lenamiu2025'
```

Change `lenamiu2025` to whatever you want, like:
```javascript
const SECRET = 'myprivatepage99'
```

Save the file (Ctrl+S). Now the URL to unlock is `#myprivatepage99`.

---

## PART 3 — Put it on the Internet (for free!)

### Step 7 — Build your site (this scrambles/protects your code)

In the terminal, type:
```
npm run build
```

This creates a `dist/` folder with your site. The code inside is **minified** — it looks like scrambled nonsense to anyone who tries to read it. Your original readable code stays only on your computer. ✅

---

### Step 8 — Deploy to Vercel (free hosting)

Vercel is the easiest free way to put your site online.

**Option A — Using the Vercel website (easiest)**

1. Go to **https://vercel.com** and sign up for free (use GitHub, Google, or email)
2. Click **"Add New Project"**
3. Click **"Upload"** (or drag and drop your `lenamiu` folder, or the `dist` folder)
4. Wait ~1 minute — Vercel will give you a URL like `https://lenamiu-abc123.vercel.app`

**Option B — Using the terminal (slightly faster after first time)**

In the terminal:
```
npm install -g vercel
vercel
```
Follow the prompts (press Enter to accept defaults). It will give you a live URL at the end.

---

### Step 9 — Share your private link

Your site will be at something like:
```
https://lenamiu-abc123.vercel.app
```

But remember — to actually **enter** the gallery, visitors need the secret hash:
```
https://lenamiu-abc123.vercel.app/#lenamiu2025
```

Use the **QR code** shown inside your gallery to share this link. People who just visit the plain URL will only see the lock screen.

---

## PART 4 — Making Changes Later

Whenever you edit your files:

1. Test locally: `npm run dev`
2. Build again:  `npm run build`
3. Re-deploy:    `vercel --prod` (or re-upload the new `dist` folder on Vercel's website)

---

## Common Problems & Fixes

| Problem | Fix |
|---------|-----|
| `node` not found | Restart your computer after installing Node.js |
| `npm install` fails | Make sure you're inside the `lenamiu` folder in the terminal |
| Blank white page | Make sure the URL has `#lenamiu2025` at the end |
| QR code doesn't work | The QR code uses your current URL — it only works once deployed, not on localhost |
| Video upload doesn't persist after refresh | Uploaded files are stored in browser memory — use YouTube/Vimeo links for permanent videos |

---

## 🔒 About Source Code Protection

When you run `npm run build`:

- Your beautiful readable code → gets **bundled and minified** into unreadable text
- Example: `function openLightbox(idx)` becomes `a(b){c(b)}` — no one can read it
- Visitors see **only** the website — not your HTML, not your CSS, not your JavaScript logic
- Your original `.jsx` files stay **only on your computer** — they are never uploaded

> ⚠️ Note: Videos hosted on YouTube/Vimeo are on those platforms' servers, not yours. Uploaded videos (blob files) only exist in that browser session and are not exposed in your code.

---

Made with ♡ — enjoy your gallery!
