#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🚀 Starting Build Process..."

# 1. Build Landing Page
echo "--- Building Landing Page ---"
cd frontend/web
npm install
npm run build
cd ../..

# 2. Build DashDark (Dashboard)
echo "--- Building Dashboard ---"
cd frontend/dash
npm install
npm run build
cd ../..

# 3. Install Python Dependencies
echo "--- Installing Python Requirements ---"
cd backend
pip install -r requirements.txt

echo "✅ Build Complete!"