#!/usr/bin/env bash

npm run build
rsync -ru build/ s1.dvk.co:/var/www/www.dutchfirecalc.nl/