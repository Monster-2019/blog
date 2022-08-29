#!/bin/bash

msg="${1:-add new post}"

git add .
git commit -m "$msg"
git pull
git push origin main