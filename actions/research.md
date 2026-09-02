# Action: research the WordPress site

## Goal

Understand the public business context before asking questions or proposing a
MoonPress Chat configuration.

## Procedure

1. Normalize the supplied URL to its canonical HTTPS origin.
2. Confirm the final hostname after redirects. Stop on a different organization
   or an unexpected authentication wall.
3. Check `robots.txt` and the XML sitemap when available.
4. Read the homepage plus the most relevant service, product, about, contact,
   FAQ, policy, and support pages.
5. Record claims with their exact source URLs.
6. Separate published facts from inferences and unknowns.
7. Write `moonpresschat-setup/research.md` using `templates/research.md`.

## Boundaries

- Public pages only; no login, form submission, account area, or private API.
- Do not scrape visitor data, conversations, emails, or personal account pages.
- Do not turn marketing claims into guarantees or legal advice.
- Do not ask the owner to repeat facts already supported by a public source.
- If the site blocks automated reading, list the pages the owner should supply;
  do not bypass the control.

## Owner-supplied fallback

If public research is unavailable, accept only content the owner deliberately
provides as a local file, pasted excerpt, or public URL. For every supplied
source, record:

- `provenance: owner-supplied`;
- source title or filename;
- date supplied;
- whether the source is public, private, or unknown;
- the exact facts derived from it.

Never label owner-supplied content as independently public-verified. If the
owner cannot supply the needed source, keep the fact `unresolved` and block any
configuration row that depends on it.
