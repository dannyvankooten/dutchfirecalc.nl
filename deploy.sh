#!/usr/bin/env bash

yarn build
rsync -ru build/ 136.144.130.19:/var/www/www.dutchfirecalc.nl/