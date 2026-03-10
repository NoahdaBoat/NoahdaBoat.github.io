# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based personal website for Noah Monti hosted on GitHub Pages. The site uses the minima theme with custom dark mode functionality.

## Development Commands

### Local Development
```bash
# Install dependencies
bundle install

# Start local development server with auto-reload
bundle exec jekyll serve

# Build the site for production
bundle exec jekyll build
```

### GitHub Pages Deployment
The site automatically deploys to GitHub Pages when changes are pushed to the `gh-pages` branch. No manual build step required.

## Architecture & Structure

### Theme Customization
- Uses minima theme as base (`gem "minima", "~> 2.5"`)
- Custom styles in `assets/main.scss` override theme defaults (Jekyll's expected location)
- Custom layout in `_layouts/default.html` extends minima's default layout

### Dark Mode Implementation
- CSS variables in `assets/main.scss` define light/dark theme colors
- JavaScript toggle in `assets/js/theme-toggle.js` handles theme switching
- Theme preference persisted in localStorage
- Toggle button positioned fixed in top-right corner (🌙/☀️)
- Theme-aware signature images switch automatically between light/dark modes

### Content Structure
- Homepage: `index.markdown` (layout: home)
- About page: `about.markdown` (layout: page)
- Blog posts: `_posts/` directory with YYYY-MM-DD-title.markdown format
- Custom layouts: `_layouts/` directory
- Static assets: `assets/images/` for images, `assets/js/` for JavaScript

### Configuration
- Main config: `_config.yml`
- Site domain: noahmonti.com
- Uses GitHub Pages gem for compatibility
- Jekyll feed plugin enabled for RSS

### Key Files for Customization
- `_config.yml`: Site configuration and metadata
- `assets/main.scss`: Custom CSS and dark mode styles (Jekyll's main stylesheet)
- `assets/js/theme-toggle.js`: Dark mode toggle functionality
- `_layouts/default.html`: Custom layout that includes theme toggle script
- `assets/images/signature-white.png`: White signature for light mode
- `assets/images/signature-black.png`: Black signature for dark mode

### Jekyll Plugins
- `jekyll-feed`: Generates RSS feed at `/feed.xml`

### Development Notes
- Site builds to `_site/` directory (not tracked in git)
- Uses GitHub Pages deployment, so gems must be compatible
- Custom assets (CSS/JS) follow Jekyll asset pipeline conventions
- AGENTS.md is excluded from Jekyll processing (in _config.yml exclude list)
- Files with underscore prefixes are treated as private by Jekyll and won't be copied to _site
- Theme switching uses `[data-theme="dark"]` CSS selectors with `!important` for specificity