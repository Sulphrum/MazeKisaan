"""Compatibility entrypoint for the official market-data updater.

Use seed_demo_history.py separately when explicitly creating offline demo history.
"""

from sync_market_data import main


if __name__ == "__main__":
    raise SystemExit(main())
