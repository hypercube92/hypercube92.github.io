#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

const options = {
  sourceLocale: 'fr',
  targetLocale: 'en',
  translate: true,
  watch: false,
  openaiApiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini',
  libretranslateUrl: process.env.LIBRETRANSLATE_URL || '',
};

args.forEach((arg) => {
  if (arg === '--watch') {
    options.watch = true;
    return;
  }
  if (arg === '--no-translate') {
    options.translate = false;
    return;
  }
  if (arg.startsWith('--from=')) {
    options.sourceLocale = arg.split('=', 2)[1] || 'fr';
    return;
  }
  if (arg.startsWith('--to=')) {
    options.targetLocale = arg.split('=', 2)[1] || 'en';
    return;
  }
  if (arg.startsWith('--openai-api-base=')) {
    options.openaiApiBase = arg.split('=', 2)[1] || options.openaiApiBase;
  }
});

const SEGMENT_MAP = {
  reserver: 'book',
  privatisation: 'private-events',
  'avis-clients': 'reviews',
  recrutement: 'careers',
  commandes: 'order',
  'politique-confidentialite': 'privacy-policy',
  'politique-cookies': 'cookie-policy',
  'mentions-legales': 'legal-notice',
  dejeuner: 'lunch',
  'petit-dejeuner': 'breakfast',
  boissons: 'drinks',
  evenements: 'events',
  blog: 'journal',
};

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, options.sourceLocale);
const TARGET_DIR = path.join(ROOT, options.targetLocale);

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`[sync-locales] Source directory not found: ${SOURCE_DIR}`);
  process.exit(1);
}

function parseArgsUsage() {
  console.log(`sync-locales.mjs --from=<locale> --to=<locale> [--watch] [--no-translate]`);
  console.log('Examples:');
  console.log('  node scripts/sync-locales.mjs --from=fr --to=en --watch');
}

if (args.includes('--help') || args.includes('-h')) {
  parseArgsUsage();
  process.exit(0);
}

function collectHtmlFiles(dir, collected = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const candidate = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectHtmlFiles(candidate, collected);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      collected.push(candidate);
    }
  }
  return collected;
}

function mapSegment(segment) {
  return SEGMENT_MAP[segment] || segment;
}

function mapRelativePath(relative) {
  const parts = relative.split(path.sep).filter(Boolean);
  if (parts.length === 0) {
    return 'index.html';
  }

  return parts.map((segment) => mapSegment(segment)).join(path.sep);
}

function splitPathAndSuffix(input) {
  const hashIndex = input.indexOf('#');
  const queryIndex = input.indexOf('?');

  let splitAt = -1;
  if (queryIndex !== -1 && (hashIndex === -1 || queryIndex < hashIndex)) {
    splitAt = queryIndex;
  }
  if (hashIndex !== -1 && (splitAt === -1 || hashIndex < splitAt)) {
    splitAt = hashIndex;
  }

  if (splitAt === -1) {
    return [input, ''];
  }

  return [input.slice(0, splitAt), input.slice(splitAt)];
}

function isExternalOrSpecialUrl(url) {
  return (
    !url ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('#') ||
    url.startsWith('javascript:') ||
    url.startsWith('data:')
  );
}

function mapLocalePath(value) {
  if (!value || isExternalOrSpecialUrl(value)) {
    return value;
  }

  if (!value.startsWith('/')) {
    return value;
  }

  const [pathOnly, suffix] = splitPathAndSuffix(value);

  if (pathOnly === '/fr') {
    return `/en${suffix}`;
  }

  if (pathOnly === '/fr/') {
    return `/en/${suffix}`;
  }

  if (!pathOnly.startsWith('/fr/')) {
    return value;
  }

  const relative = pathOnly.slice(4);
  if (!relative) {
    return `/en/${suffix}`;
  }

  const segments = relative.split('/').filter(Boolean);
  const mapped = segments.map(mapSegment);
  const suffixSlash = pathOnly.endsWith('/') ? '/' : '';

  return `/en/${mapped.join('/')}${suffixSlash}${suffix}`;
}

function mapDomainLocalizedUrls(html) {
  return html
    .replace(/https:\/\/legeneralwagram\.com\/fr\b/g, 'https://legeneralwagram.com/en')
    .replace(/https:\/\/www\.legeneralwagram\.com\/fr\b/g, 'https://www.legeneralwagram.com/en');
}

function mapUrlsInHtml(html) {
  const withReplacedDomain = mapDomainLocalizedUrls(html);

  return withReplacedDomain
    .replace(/\b(?:href|src|action|poster)=("|')([^"']+)\1/gi, (match, quote, value) => {
      const rewritten = mapLocalePath(value);
      return match.replace(value, rewritten);
    })
    .replace(/\bsrcset=("|')([^"']+)\1/gi, (match, quote, value) => {
      const rewrittenValues = value
        .split(',')
        .map((entry) => {
          const parts = entry.trim().split(/\s+/);
          parts[0] = mapLocalePath(parts[0]);
          return parts.join(' ');
        })
        .join(', ');

      return `srcset=${quote}${rewrittenValues}${quote}`;
    });
}

function rewriteDomMetadata(html) {
  let updated = mapUrlsInHtml(html);
  updated = updated.replace(/<html\s+[^>]*lang="[^"]+"/i, '<html lang="en"');
  updated = updated.replace(/<meta property="og:locale"[^>]*>/i, '<meta property="og:locale" content="en_GB" />');
  return updated;
}

function protectJsonLdBlocks(html) {
  const blocks = [];
  const placeholder = '__LG_JSONLD_PLACEHOLDER__';

  const replaced = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, (match) => {
    const id = `${placeholder}${blocks.length}__`;
    blocks.push(match);
    return id;
  });

  return { replaced, blocks, placeholder };
}

function restoreJsonLdBlocks(html, blocks, placeholder) {
  return blocks.reduce((acc, block, index) => acc.replace(`${placeholder}${index}__`, block), html);
}

function stripCodeFence(text) {
  return text
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

async function translateWithOpenAI(html) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const endpoint = `${options.openaiApiBase.replace(/\/$/, '')}/chat/completions`;

  const body = {
    model: options.openaiModel,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are a professional localization engine for a restaurant website. Translate only French user-facing text to English while preserving HTML structure, tags, URLs, phone numbers, emails, IDs, JSON-LD blocks and numeric values.',
      },
      {
        role: 'user',
        content:
          'Translate the full HTML page from French to English, while keeping all HTML markup untouched. Preserve URLs, JSON-LD script blocks and schema identifiers. Return only the translated HTML.',
      },
      {
        role: 'user',
        content: html,
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content || '';
  return stripCodeFence(typeof translated === 'string' ? translated : '');
}

async function translateWithLibre(html) {
  if (!options.libretranslateUrl) {
    return null;
  }

  const response = await fetch(options.libretranslateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: html, source: 'fr', target: 'en', format: 'html' }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data?.translatedText || '').toString();
}

async function translateIfNeeded(html) {
  if (!options.translate) {
    return { html, provider: 'disabled' };
  }

  const { replaced, blocks, placeholder } = protectJsonLdBlocks(html);

  const provider =
    process.env.OPENAI_API_KEY ? 'openai' : options.libretranslateUrl ? 'libretranslate' : 'none';

  if (provider === 'none') {
    console.log('[sync-locales] No translation provider configured (set OPENAI_API_KEY or LIBRETRANSLATE_URL), skipping translation');
    return { html: restoreJsonLdBlocks(replaced, blocks, placeholder), provider: 'skipped' };
  }

  let translated;

  try {
    if (provider === 'openai') {
      translated = await translateWithOpenAI(replaced);
    } else {
      translated = await translateWithLibre(replaced);
    }
  } catch (error) {
    console.warn('[sync-locales] Translation failed, keeping source FR copy:', error.message);
    return { html: restoreJsonLdBlocks(replaced, blocks, placeholder), provider: 'failed' };
  }

  if (!translated || !translated.trim()) {
    console.warn('[sync-locales] Translation returned empty response, keeping source FR copy');
    return { html: restoreJsonLdBlocks(replaced, blocks, placeholder), provider: 'empty' };
  }

  return {
    html: restoreJsonLdBlocks(translated, blocks, placeholder),
    provider,
  };
}

async function syncFile(sourceFile) {
  const sourceContent = fs.readFileSync(sourceFile, 'utf8');
  const relative = path.relative(SOURCE_DIR, sourceFile);
  const destinationRelative = mapRelativePath(relative);
  const destination = path.join(TARGET_DIR, destinationRelative);

  const preprocessed = rewriteDomMetadata(sourceContent);
  const { html: translated, provider } = await translateIfNeeded(preprocessed);

  if (provider === 'disabled') {
    // keep untranslated FR content if user asked no automatic translation,
    // but still rewrite EN paths from French source links.
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, translated, 'utf8');
  console.log(`[sync-locales] Wrote ${path.relative(ROOT, destination)} (${provider})`);
}

async function syncAll() {
  const htmlFiles = collectHtmlFiles(SOURCE_DIR);
  for (const file of htmlFiles) {
    await syncFile(file);
  }
  console.log(`[sync-locales] Synced ${htmlFiles.length} pages from /${options.sourceLocale} to /${options.targetLocale}`);
}

function startWatch() {
  console.log(`[sync-locales] Watching ${SOURCE_DIR} ...`);
  let debounce = null;

  fs.watch(
    SOURCE_DIR,
    {
      recursive: true,
    },
    () => {
      if (debounce) {
        clearTimeout(debounce);
      }
      debounce = setTimeout(() => {
        syncAll().catch((error) => {
          console.error('[sync-locales] Watch sync failed:', error.message);
        });
      }, 250);
    }
  );
}

syncAll()
  .then(() => {
    if (options.watch) {
      startWatch();
    }
  })
  .catch((error) => {
    console.error('[sync-locales] Error:', error.message);
    process.exit(1);
  });
