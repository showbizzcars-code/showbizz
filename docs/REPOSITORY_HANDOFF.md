# GitHub handoff

Suggested repository: `xconversionlab/showbizz-cars-website` (private).

The source repository is separate from the client's production hosting. A private GitHub repository can hold source and version history while the running website remains in the client's Hostinger account.

## Create the remote repository

1. Sign in to GitHub as the account that should own the source.
2. Create `showbizz-cars-website` as a **Private** repository.
3. Leave “Add a README”, `.gitignore`, and license unchecked so the remote starts empty.
4. From the extracted project root, run:

```sh
git init
git add -A
git commit -m "Prepare Showbizz Cars foundation for Hostinger"
git branch -M main
git remote add origin https://github.com/xconversionlab/showbizz-cars-website.git
git push -u origin main
```

If the remote uses another owner or repository name, replace the URL accordingly. GitHub CLI or the Git Credential Manager may prompt you to authenticate during `git push`; never paste a personal access token into this document or into source files.

## After pushing

- Check that `.env`, local database files, `.output/`, `node_modules/`, and workspace internals are absent from the repository.
- Keep the repository private while client details and production readiness are still being finalized.
- Do not connect GitHub pushes to an automatic production deployment until Hostinger settings, secrets, database, authentication, and backups have been reviewed.
Preview deployment verification pending.
