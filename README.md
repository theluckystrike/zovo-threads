# Zovo Threads

Zovo Threads is an independent GPL-3.0 fork of Reddit Enhancement Suite. It
keeps the proven RES core and adds a keyboard-first adapter for current Reddit
threads: J/K navigation, local author tags, subreddit-scoped filters, inline
media controls, and per-thread reading-position memory.

This distribution is maintained by the Zovo Threads contributors and is not an
official RES release. Upstream history and attribution are preserved below.

## Build this fork

Install dependencies with `npm install`, then create the Chrome production
package with:

```sh
SUPABASE_ANON_KEY=sb_publishable_your_key npm run build
```

The key is Supabase's public/publishable client credential; production builds
intentionally fail when it is absent. The output is `dist/zip/chrome.zip`, and
`dist/chrome/` can be loaded unpacked in Chrome. See `CHANGES-ZOVO.md` for the
fork-specific change log.

The complete source is licensed under GPL-3.0. The optional licence UI does not
limit anyone's right or technical ability to inspect, modify, rebuild, or
redistribute the program under that licence.

## Upstream project

The repository was forked from Reddit Enhancement Suite at commit
`a12cc4e7c045bfb4dc1120687abd6bd0975ff9ba`.

[![RES Pipeline](https://github.com/honestbleeps/Reddit-Enhancement-Suite/actions/workflows/pipeline.yml/badge.svg)](https://github.com/honestbleeps/Reddit-Enhancement-Suite/actions/workflows/pipeline.yml)
[![Chat on Discord](https://img.shields.io/discord/681993947085799490?label=Discord)](https://discord.gg/UzkFNNa)

## [Please read this post before continuing.](https://www.reddit.com/r/RESAnnouncements/comments/sh83gx/announcement_life_of_reddit_enhancement_suite/)

Reddit Enhancement Suite (RES) is a suite of modules that enhances your Reddit browsing experience.
For general documentation, visit the [Reddit Enhancement Suite Wiki](https://www.reddit.com/r/Enhancement/wiki/index).

## Introduction

Hi there! Thanks for checking out RES on GitHub. A few important notes:

1. RES is licensed under GPLv3, which means you're technically free to do whatever you wish in terms of redistribution as long as you maintain GPLv3 licensing. However, I ask out of courtesy that should you choose to release your own, separate distribution of RES, you please name it something else entirely. Unfortunately, I have run into problems in the past with people redistributing under the same name, and causing me tech support headaches.

2. I ask that you please do not distribute your own binaries of RES (e.g. with bugfixes, etc). The version numbers in RES are important references for tech support so that we can replicate bugs that users report using the same version they are, and when you distribute your own - you run the risk of polluting/confusing that. In addition, if a user overwrites his/her extension with your distributed copy, it may not properly retain their RES settings/data depending on the developer ID used, etc.

I can't stop you from doing any of this. I'm just asking out of courtesy because I already spend a great deal of time providing tech support and chasing down bugs, and it's much harder when people think I'm the support guy for a separate branch of code.

Thanks!

Steve Sobel
steve@honestbleeps.com

## Building and contributing

See [CONTRIBUTING.md](/CONTRIBUTING.md).

## License

See [LICENSE](/LICENSE).

## Changelog

See the [`changelog/`](/changelog) directory for individual versions or https://redditenhancementsuite.com/releases/ for all versions.
