#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "🚀 Starting Build Process..."

# 1. Build Landing Page
echo "--- Building Landing Page ---"
cd web
npm install
npm run build
cd ..

# 2. Build DashDark (Dashboard)
echo "--- Building Dashboard ---"
cd dash
npm install
npm run build
cd ..

# 3. Organize Files for Flask
echo "--- Moving Static Files to Backend ---"
# Clean old static folder
rm -rf backend/static
mkdir -p backend/static/dashboard

# Copy Landing Page files to root of static
cp -r web/dist/* backend/static/

# Copy Dashboard files to static/dashboard
cp -r dash/dist/* backend/static/dashboard/

# 4. Install Python Dependencies
echo "--- Installing Python Requirements ---"
cd backend
pip install -r requirements.txt

echo "✅ Build Complete!"