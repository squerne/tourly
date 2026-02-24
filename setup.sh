#!/bin/bash

echo "Tourly Setup Script"
echo "==================="

if [ -z "$1" ]; then
  echo "Error: Need a target directory."
  echo "Usage: ./setup.sh <path-to-nextjs-project>"
  exit 1
fi

DEST="$1"

if [ ! -d "$DEST" ]; then
  echo "Error: Target directory '$DEST' does not exist."
  exit 1
fi

echo "Copying components..."
mkdir -p "$DEST/components/tourly"
cp -r components/tourly/* "$DEST/components/tourly/"

echo "Copying lib store..."
mkdir -p "$DEST/lib"
cp lib/tourlyStore.ts "$DEST/lib/"

echo "Copying API routes..."
mkdir -p "$DEST/app/api/tours"
cp -r app/api/tours/* "$DEST/app/api/tours/"

echo "Setup complete! Copied Tourly to $DEST."
echo "Please see README.md for database and environment setup."
