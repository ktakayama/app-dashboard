# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Mobile app development dashboard for monitoring multiple GitHub repositories. See `docs/PROJECT_OVERVIEW.md` for complete details.

## Essential Commands

### Development
```bash
bun run dev           # Start development server
bun run build         # Production build
bun run update        # Update app data from GitHub API
```

### Code Quality
```bash
bun run lint          # ESLint check
bun run format        # Prettier formatting  
bun run test          # Run Vitest tests
```

## Tech Stack
- **Runtime**: Bun (always use over npm/yarn)
- **Frontend**: Astro + Svelte + TailwindCSS
- **Data**: JSON files, GitHub API, iTunes Search API

## Key Architecture Points

### Data Flow
CLI scripts → GitHub/iTunes APIs → JSON storage → Astro/Svelte rendering

### Critical Files
- `src/data/apps.json` - App data storage
- `scripts/update-data.js` - Data fetching CLI
- `config.json` - Repository configuration
- `.env` - GitHub token (required)

## Development Notes

- **Documentation**: Detailed docs in `docs/` (Japanese)
- **Local Only**: Never deploy publicly
- **API Limits**: GitHub has 5000 req/hour with auth
- **Bun First**: Always prefer `bun` commands
- **Manual Updates**: Data refreshes via CLI only, no auto-polling
