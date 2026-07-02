# Deploy to GCP — `agent-hub-501104`

This is a static Next.js export, so the simplest GCP target is **Firebase Hosting**
(HTTPS + CDN, tied to the same GCP project). A Cloud Storage option and a
server-side Cloud Run option are below.

> Project ID: `agent-hub-501104` · Project number: `962218194776`
> The repo is already configured for Firebase (`firebase.json`, `.firebaserc`).

---

## Option A — Firebase Hosting (recommended, static)

One-time:

```bash
npm install -g firebase-tools
firebase login                       # opens your browser (your Google account)
firebase projects:list               # confirm agent-hub-501104 is listed
# If Hosting was never set up on the project:
firebase init hosting                 # choose "use existing", pick agent-hub-501104,
                                       # public dir: out, single-page app: No
```

Deploy (build + push):

```bash
npm run deploy:firebase
# = npm run build:html && firebase deploy --only hosting
```

Live URL: `https://agent-hub-501104.web.app` (and `…firebaseapp.com`).

The AI still uses **bring-your-own-key** (Anthropic key in the browser) and the
keyless web-search + Apify token work exactly as on GitHub Pages.

---

## Option B — Cloud Storage static website

```bash
gcloud config set project agent-hub-501104
gsutil mb -l us-central1 gs://agent-hub-entertainment-agents        # once
gsutil web set -m index.html -e 404.html gs://agent-hub-entertainment-agents
npm run deploy:gcs                                                   # build + rsync out/ → bucket
gsutil iam ch allUsers:objectViewer gs://agent-hub-entertainment-agents  # public read
```

URL: `https://storage.googleapis.com/agent-hub-entertainment-agents/index.html`
(For a custom domain + HTTPS you'd front the bucket with an HTTPS Load Balancer.)

---

## Option C — Cloud Run (server-side, no BYO key needed)

Run the full Next.js server so `/api/chat` works with the key kept server-side —
visitors don't need their own Anthropic key.

1. Remove `output: export` for this build (use the normal `next build` + `next start`).
2. Containerize (Dockerfile with `node`, `npm ci`, `npm run build`, `CMD next start`).
3. Deploy:
   ```bash
   gcloud run deploy entertainment-agents \
     --source . --project agent-hub-501104 --region us-central1 \
     --allow-unauthenticated --set-env-vars ANTHROPIC_API_KEY=<your-key>
   ```
The app already prefers the server route when a backend is present, so AI works
for everyone with the key server-side. Ask if you want the Dockerfile + config added.
