# Zovo Threads changes

Zovo Threads is a GPL-3.0 fork of Reddit Enhancement Suite 5.24.10 at upstream
commit `a12cc4e7c045bfb4dc1120687abd6bd0975ff9ba`.

Changes in 5.25.0:

- Added an additive Shreddit thread adapter without changing the proven legacy
  Reddit `Thing` model.
- Added keyboard-first comment navigation, local author tags, subreddit-scoped
  phrase filters, inline image expansion with one-key collapse, and per-thread
  read-position memory.
- Added a product popup, unique visual identity and icon set, and a neutral
  upgrade path.
- Added shape-only licence input validation and server verification. Pro is
  granted only when the verification response contains `valid: true`; server
  tier names are deliberately ignored so lifetime purchasers remain eligible.
- Production builds now fail if the publishable Supabase anon key is absent.

The complete modified source remains GPL-3.0. The licence UI does not restrict
the GPL rights to inspect, modify, rebuild, or redistribute this fork.

