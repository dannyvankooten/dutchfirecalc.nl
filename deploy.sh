#!/usr/bin/env bash

set -e

bin/fetch_latest_data.py

ssh -t dutchfirecalc@s1.dvk.co "\
    cd ~/dutchfirecalc.nl; \
    git pull -X theirs; \
    source ~/.cargo/env; \
    cargo build --release; \
    sudo systemctl restart dutchfirecalc; \
    "