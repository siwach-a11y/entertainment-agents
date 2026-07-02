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

## Full hands-off (auto-deploy on every push)

After this one-time setup, every `git push` to `main` builds and deploys itself —
no manual steps.

### Easiest — let Firebase wire it up (one command)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting:github
```

Answer the prompts:
- **Repository:** `siwach-a11y/entertainment-agents`
- **Set up the workflow to run a build script before every deploy?** `Yes`
- **Build script:** `npm ci && npm run build:html`
- **Automatic deploy on merge to `main`?** `Yes`

This creates a CI **service account**, stores it as a repo **secret**, and commits
the GitHub Actions **workflow** — all automatically. Done. Every push now deploys to
`https://agent-hub-501104.web.app`.

### Manual equivalent (if you'd rather not use init)

1. Create the service account + repo secret:
   ```bash
   gcloud iam service-accounts create gh-firebase-deployer \
     --project agent-hub-501104 --display-name "GitHub Firebase Deployer"
   gcloud projects add-iam-policy-binding agent-hub-501104 \
     --member "serviceAccount:gh-firebase-deployer@agent-hub-501104.iam.gserviceaccount.com" \
     --role roles/firebasehosting.admin
   gcloud projects add-iam-policy-binding agent-hub-501104 \
     --member "serviceAccount:gh-firebase-deployer@agent-hub-501104.iam.gserviceaccount.com" \
     --role roles/serviceusage.serviceUsageConsumer
   gcloud iam service-accounts keys create key.json \
     --iam-account gh-firebase-deployer@agent-hub-501104.iam.gserviceaccount.com
   gh secret set FIREBASE_SERVICE_ACCOUNT_AGENT_HUB_501104 < key.json \
     --repo siwach-a11y/entertainment-agents
   rm key.json                       # don't keep the key around
   ```
2. Put the workflow in place (it ships in `ci/`):
   ```bash
   mkdir -p .github/workflows
   git mv ci/firebase-deploy.yml .github/workflows/firebase-deploy.yml
   git commit -m "ci: firebase auto-deploy" && git push
   ```
   (Pushing under `.github/workflows/` needs a token with the `workflow` scope —
   your normal `git`/GitHub login has it.)

Either path → auto-deploy on every push, zero manual steps thereafter.

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
