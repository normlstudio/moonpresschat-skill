# Collection configuration — plugin 5.11.0

Negotiate `collection` in GET /setup/compatibility. Keep it optional: base setup
still works on older compatible plugins through public research. Do not infer
capabilities from a version string alone.

GET /setup/collection returns the effective max_pages, selected languages and
index state. New collections default to 200. Preserve an existing smaller limit;
200 is neither a paid limit nor a model context-window size.

The optional envelope section `configuration.collection` supports max_pages
(positive integer), sitemap_url (same origin/protocol/port XML URL; empty disables)
and languages (language codes; empty array includes all). Omit unchanged fields.
Use normal validate → owner approval → apply; never write arbitrary WP options.
A missing capability forbids this section and all collection endpoints.

POST /setup/collection/collect accepts {} to start and {"resume":true} to resume.
It writes a temporary analysis draft, not live knowledge, and makes no model call.
The start request may include an explicit positive-integer exclude list; resume
preserves the draft's exclusions. Never mix changed exclusions with resume.

POST /setup/collection/index accepts {}. A configured sitemap is required.
HTTP200 is not success by itself: inspect index.error, pending and actual rows.
Pending/error/empty results are not a completed index. Verify contact/privacy
and other important links, including canonical URLs and their source pages.

Each apply replaces the server's one rollback snapshot. A collection apply
followed by a knowledge apply cannot be undone by one rollback to the start of
setup. Prefer one reviewed envelope; record each apply/rollback boundary and
keep the owner's full backup/reset checkpoint. Temporary collection drafts are
not restored by setup rollback. See actions/collect-and-analyze.md.
