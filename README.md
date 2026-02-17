# Le General Wagram - Website Refactor

Bilingual marketing website (FR/EN) built as a static SEO-first architecture.

## Run locally

```bash
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/fr/`
- `http://localhost:8080/en/`

## Auto-sync FR -> EN

La version française est la source de vérité. Les pages EN peuvent être régénérées depuis les pages FR:

```bash
node scripts/sync-locales.mjs --from=fr --to=en
```

Options:

- `--watch` : surveille `fr/` et synchronise automatiquement chaque changement.
- `--no-translate` : ne copie que la structure/liens et ne traduit pas les textes.
- `--from=<locale>` / `--to=<locale>` : changer les dossiers source/cible.

La traduction automatique utilise l'un des providers disponibles:

- OpenAI (`OPENAI_API_KEY` et optionnellement `OPENAI_TRANSLATION_MODEL`)
- LibreTranslate (`LIBRETRANSLATE_URL`)

Sans provider configuré, le script reconstruit quand même le site EN avec les bons chemins, mais en français.

## Key files
- `/assets/styles.css`: design system + responsive layout
- `/assets/script.js`: navigation, animations, form validation, menu filter
- `/sitemap.xml`: crawl map
- `/robots.txt`: crawler directives
- `/TEAM_EXECUTION.md`: 3-expert execution tracks

## Core pages
- FR: home, menus, booking, private events, events, reviews, contact, careers, FAQ, blog, legal, privacy, cookies, order
- EN: mirrored structure
