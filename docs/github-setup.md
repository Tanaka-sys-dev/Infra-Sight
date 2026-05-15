# GitHub Repository Setup

## Repository name
infrasight-gzu

## Steps to push
```powershell
git remote add origin https://github.com/YOUR_USERNAME/infrasight-gzu.git
git branch -M main
git push -u origin main
```

## Environment variables to add on Vercel
Add all `VITE_` variables from `infrasight-web/.env` or `infrasight-web/.env.production` in the Vercel project settings.

## Environment variables to add on Render
Add all `FIREBASE_` variables from `infrasight-api/.env` in the Render service environment settings.

## Important
Never commit `.env` files.
Never commit the Firebase service account JSON.
Never commit the `.venv` folder.
Never commit `node_modules`.
Never commit `ml/models` folder.
