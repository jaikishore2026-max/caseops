# GitHub push commands

The source ZIP does not include `.git` history. Run these commands from the extracted `caseops` directory and replace the repository placeholder with the URL of the intended CaseOps GitHub repository. These commands create a local `main` branch and push it to GitHub; they do not publish the website.

```sh
cd caseops
git init -b main
git add -A
git commit -m "Build live INR compliance investigation workbench"
git remote add origin git@github.com:<OWNER>/<REPOSITORY>.git
git push -u origin main
```

For an existing GitHub checkout, instead create a feature branch and push that branch:

```sh
git switch -c caseops-live-inr
git add -A
git commit -m "Add live INR streaming and adaptive risk scoring"
git push -u origin caseops-live-inr
```

The CaseOps preview project uses its own Manus canonical Git remote. No GitHub push was performed by this task, and no website publication was performed.
