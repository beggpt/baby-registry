#!/bin/bash
# Pokretanje: bash push-changes.sh "opis promjena"

MSG=${1:-"update: rebuild s novim feature-ima"}
git add .
git commit -m "$MSG"
git push
echo ""
echo "✅ Promjene su pushane na GitHub!"
echo "Railway će automatski pokrenuti novi deployment."
