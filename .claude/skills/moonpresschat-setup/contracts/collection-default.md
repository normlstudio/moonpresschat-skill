# Page collection default and setup boundary

The agreed new plugin collection default is **200**, with explicit smaller test
values preserved. It is not a paid limit or the model's context-window size.

Do not assume that a `5.10.0` version string proves this change. The tested
plugin candidate `094345e` contains the default-200 wizard/backend change, but
it is not integrated into the published plugin release. The candidate also
has a separate sitemap navigation index budget per language. These are
separate controls.

The released setup API configuration envelope does **not** expose
`analysis_max_pages`, sitemap URL or language-selection fields. Never put them
in `/setup/validate` or `/setup/apply`, call internal `/admin/*` routes through
the setup credential, or silently widen that credential's scope.

Record the installed build and observed control. Preserve a saved lower value.
Use the supported human-guided wizard for page-limit decisions until the API
advertises an explicit reviewed capability for them. Research may organize
URL/title/short-description evidence without pretending it persisted a plugin
index. Verify important contact, privacy, reviews and product URLs separately.
An older/default-30 install stays recorded as such; do not claim both collection
paths implement 200 merely because this skill documents the target.
