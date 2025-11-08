# Git Workflow Guide for VibeState Project

## Project Structure

```
vibestate/
├── android app/     (Android Studio)
├── backend/         (WebStorm IDE)
└── frontend/        (WebStorm IDE)
```

## Recommended Git Workflow

### 🎯 Strategy: Branch-Based Development

Since you're working across multiple IDEs (Android Studio + WebStorm), use a **branch-based workflow** to keep your work
organized and prevent conflicts.

---

## 📋 Daily Workflow

### 1. **Start Your Work Session**

Always start by pulling the latest changes:

```bash
cd D:/projects/CursorGallery/vibestate
git pull origin main
```

### 2. **Create Feature Branches**

Create separate branches for different features/components:

```bash
# For frontend work
git checkout -b feature/frontend-dashboard

# For backend work
git checkout -b feature/backend-api

# For android work
git checkout -b feature/android-auth
```

### 3. **Work on Your Changes**

- **In WebStorm**: Make changes to `frontend/` and `backend/`
- **In Android Studio**: Make changes to `android app/`

### 4. **Commit Frequently**

Commit small, logical chunks of work:

```bash
# Check what changed
git status

# Stage specific files
git add frontend/src/components/Dashboard.jsx
git add backend/app.py

# Or stage all changes in a folder
git add frontend/
git add backend/
git add "android app/"

# Commit with a descriptive message
git commit -m "feat: add user dashboard UI"
git commit -m "fix: resolve authentication bug in backend"
git commit -m "feat: implement Google Auth in Android app"
```

### 5. **Push Your Branch**

```bash
git push origin feature/frontend-dashboard
```

### 6. **Merge to Main**

When your feature is complete and tested:

```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge your feature branch
git merge feature/frontend-dashboard

# Push to GitHub
git push origin main

# Delete the feature branch (optional)
git branch -d feature/frontend-dashboard
git push origin --delete feature/frontend-dashboard
```

---

## 🔄 Alternative: Simple Workflow (For Solo Development)

If you prefer a simpler approach since you're working alone:

### Daily Routine:

```bash
# 1. Pull latest changes before starting work
git pull origin main

# 2. Make your changes in any IDE

# 3. Stage and commit changes
git add .
git commit -m "descriptive commit message"

# 4. Push to GitHub
git push origin main
```

---

## 💡 Best Practices

### Commit Message Convention

Use clear, descriptive commit messages:

```bash
# Good examples
git commit -m "feat: add user profile screen in Android app"
git commit -m "fix: resolve CORS issue in backend API"
git commit -m "refactor: improve frontend routing logic"
git commit -m "docs: update README with setup instructions"
git commit -m "style: format code in Login component"

# Prefixes:
# feat: new feature
# fix: bug fix
# refactor: code restructuring
# style: formatting, missing semicolons, etc
# docs: documentation
# test: adding tests
# chore: maintenance tasks
```

### What to Commit

✅ **DO commit:**

- Source code files
- Configuration files
- Package manifests (package.json, requirements.txt, build.gradle)
- README and documentation

❌ **DON'T commit:**

- `node_modules/` (frontend)
- `venv/` or `__pycache__/` (backend)
- `.gradle/` and `build/` (android)
- IDE-specific files (.idea/, *.iml)
- Environment files with secrets (.env)
- Build artifacts (dist/, *.apk)

### .gitignore Setup

Ensure you have a proper `.gitignore` file:

```gitignore
# Frontend
frontend/node_modules/
frontend/dist/
frontend/.env

# Backend
backend/venv/
backend/__pycache__/
backend/*.pyc
backend/.env
backend/*.db

# Android
android app/.gradle/
android app/.idea/
android app/build/
android app/*.iml
android app/local.properties
android app/*.apk
android app/*.aab

# OS
.DS_Store
Thumbs.db
```

---

## 🚀 Working Across Multiple IDEs

### Scenario 1: Switching Between IDEs

```bash
# Before closing WebStorm
git add .
git commit -m "work in progress: frontend updates"
git push origin main

# When opening Android Studio
git pull origin main
# Now your Android Studio has the latest changes
```

### Scenario 2: Working Simultaneously

If you have both IDEs open:

1. **Use feature branches** (recommended)
    - WebStorm: Work on `feature/frontend-xyz`
    - Android Studio: Work on `feature/android-xyz`
    - No conflicts!

2. **Commit and pull frequently**
   ```bash
   # Every 30-60 minutes or after completing a task
   git add .
   git commit -m "progress update"
   git pull origin main
   git push origin main
   ```

---

## 🆘 Common Issues & Solutions

### Issue 1: Merge Conflicts

```bash
# If you encounter conflicts
git status  # See conflicted files
# Open the files in your IDE and resolve conflicts
git add <resolved-files>
git commit -m "resolve merge conflicts"
git push origin main
```

### Issue 2: Accidentally Committed Wrong Files

```bash
# Remove file from staging (before commit)
git reset HEAD <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - CAREFUL!
git reset --hard HEAD~1
```

### Issue 3: Need to Discard Local Changes

```bash
# Discard changes in a specific file
git checkout -- <file>

# Discard all local changes - CAREFUL!
git reset --hard HEAD
```

### Issue 4: Check What Changed

```bash
# See what changed in working directory
git diff

# See what's staged for commit
git diff --staged

# See commit history
git log --oneline --graph --all
```

---

## 📊 Recommended Workflow for Your Setup

Since you're working on:

- Frontend + Backend in **WebStorm**
- Android app in **Android Studio**

### Best Approach:

#### **Option A: Component-Based Branches (Recommended)**

```bash
# When working on a feature that touches multiple components:
git checkout -b feature/user-authentication

# Make changes in WebStorm (frontend + backend)
# Make changes in Android Studio (android app)

# Commit all together
git add .
git commit -m "feat: implement user authentication across all platforms"
git push origin feature/user-authentication

# Merge when complete
git checkout main
git merge feature/user-authentication
git push origin main
```

#### **Option B: IDE-Specific Workflow**

```bash
# Start work in WebStorm
git checkout -b work/webstorm-session
# Make frontend & backend changes
git commit -m "update: frontend and backend changes"
git push origin work/webstorm-session

# Switch to Android Studio
git checkout -b work/android-session
# Make android changes
git commit -m "update: android app changes"
git push origin work/android-session

# Merge both when done
git checkout main
git merge work/webstorm-session
git merge work/android-session
git push origin main
```

---

## 🎯 Quick Reference Commands

```bash
# Daily start
git pull origin main

# Check status
git status

# Stage changes
git add <file>              # Specific file
git add .                   # All changes
git add frontend/           # All in folder
git add "android app/"      # Folder with spaces

# Commit
git commit -m "message"

# Push
git push origin main

# Create branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# Merge branch
git merge branch-name

# View history
git log --oneline --graph

# Undo changes
git checkout -- <file>      # Discard file changes
git reset HEAD <file>       # Unstage file
```

---

## 📝 Summary

**For your specific use case, I recommend:**

1. **Pull before every work session**: `git pull origin main`
2. **Create feature branches** for significant features
3. **Commit frequently** with descriptive messages
4. **Push at the end of each work session** or when switching IDEs
5. **Use a proper .gitignore** to avoid committing build artifacts
6. **Merge feature branches to main** when features are complete

This ensures your work is always synchronized across both IDEs and prevents losing any changes!
