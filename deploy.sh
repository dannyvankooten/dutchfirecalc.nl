#!/usr/bin/env bash
bin/fetch_latest_data.py

ssh -t dutchfirecalc@s1.dvk.co "\
    cd ~/dutchfirecalc.nl; \
    git pull; \
    source ~/.cargo/env; \
    cargo build --release; \
    sudo systemctl restart dutchfirecalc; \
    "