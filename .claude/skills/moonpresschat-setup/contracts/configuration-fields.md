# MoonPress Chat field map

Use this map to build a field-level plan. Two tiers:

- **wp-admin labels (guided path)** — the tables below reflect the
  human-facing admin UI verified for MoonPress Chat 3.11.0. If labels or constraints
  differ, stop that section with `compatibility: blocked-guide-drift`; do not
  guess internal option names.
- **Envelope mapping (API path)** — the last section maps each field/group to
  its configuration-envelope section and key, verified against MoonPress Chat 1.0.0.

## Settings → AI providers

| Field | Allowed decision | Secret or sensitive | Verification |
|---|---|---|---|
| Active provider | Anthropic, OpenAI, Gemini, or OpenRouter | No | Human confirms selection |
| Model | Listed model or supported custom model ID | No | Provider test passes |
| Provider key | Human-entered value only | Secret | Record only key saved + test passed |

## Knowledge base and Templates

| Field group | Required decision | Sensitive | Verification |
|---|---|---|---|
| Business facts | Cited public facts plus approved private facts | Maybe | Each claim maps to a source |
| FAQ / question bank | Supported visitor questions and grounded answers | Maybe | Supported-question tests |
| Hard rules | Scope, refusals, prohibited claims, escalation | No | Refusal/high-risk tests |
| Service/topic fields | Approved areas and descriptions | No | Preview topics match plan |
| Conversation templates | Welcome, intake, handoff, and default response copy | Maybe | Preview copy matches plan |

Do not paste personal customer data, historic conversations, or unsupported
claims into knowledge fields.

## Settings → Legal texts

| Field | Allowed decision | Sensitive | Verification |
|---|---|---|---|
| Consent notice | Approved notice, or explicit owner decision to leave empty | Legal decision | Appears before first message when enabled |
| Short disclaimer | Approved per-answer disclosure | Legal decision | Appears with answers |

The skill never authors legal approval. It may structure owner-supplied wording
and mark legal review unresolved.

## Settings → Human takeover and anonymous conversations

| Field | Constraint | Sensitive | Verification |
|---|---|---|---|
| Return to assistant after | 0–720 hours; 0 disables automatic return | No | Owner confirms saved value |
| Keep anonymous transcripts for | 0–3650 days; 0 keeps indefinitely | Privacy decision | Owner confirms saved value |
| Remember in browser | On/off; consider shared-device exposure | Privacy decision | Fresh-browser behavior |

## Settings → Languages

| Field | Constraint | Sensitive | Verification |
|---|---|---|---|
| Allowed languages | Keep one configured WordPress site language for the free-core plan | No | Test in that language |
| Default language | Must be one enabled language | No | Unsupported-locale fallback |

Do not promise or enable the separate Pro multilingual capability through the
free setup plan.

## Settings → Fallback messages, Notifications, and Contacts

| Field | Constraint | Sensitive | Verification |
|---|---|---|---|
| Service error | Approved copy or built-in default | No | Provider-failure test |
| Assistant offline | Approved copy or built-in default | No | No-key/offline observation |
| Daily transcript email | On/off plus approved recipient | Personal data route | Human confirms destination |
| Lead notification email | Approved recipient or site-admin default | Personal data route | Test lead reaches destination |
| Contact phone / second phone | Include country code; empty hides call buttons | Contact data | Preview call action |

Never put a real visitor's personal information into verification artifacts.

Do not clear or replace an existing write-only provider key to test the
assistant-offline message. Test it before first key entry or on a disposable
staging copy. Otherwise verify the configured copy and use the checklist's
explicit `not-applicable-existing-key-no-safe-fault-injection` evidence.

## Settings → Widget appearance and Visibility

| Field | Constraint | Sensitive | Verification |
|---|---|---|---|
| Accent color | Valid approved color | No | Mobile + desktop preview |
| Logo / header image | Approved WordPress media or official asset URL | No | Preview loads without error |
| Header background/text | Maintain readable contrast | No | Visual review |
| Position | Left or right | No | Mobile + desktop preview |
| Side/bottom offsets | 0–80 px | No | No clipping/overlap |
| Launcher size | 44, 48, or 56 px | No | Touch target check |
| Make bot live | Off during setup; separate approval required | Release gate | Anonymous public check |

## Envelope mapping (API path, verified against MoonPress Chat 1.0.0)

The configuration envelope sent to `POST /setup/validate` and
`POST /setup/apply` is `{"schema_version": "1.0", "configuration": {…}}` with
these sections. The schema is closed — an unknown key fails the whole request
with `moonpresschat_setup_unknown_field`; never invent a key this table does not
name.

| Field / group (wp-admin) | Envelope section | Key(s) |
|---|---|---|
| Active provider | `provider` | `id` (e.g. `openai`) |
| Model | `provider` | `model` |
| Provider key | — not in the envelope | Helper `provider` subcommand → `PUT /setup/provider` only |
| Consent notice | `settings` | `consent` |
| Short disclaimer | `settings` | `disclaimer` |
| Return to assistant after | `settings` | `takeover_hours` (0–720) |
| Keep anonymous transcripts for | `settings` | `anon_retention` (0–3650) |
| Remember in browser | `settings` | `anon_remember` (bool) |
| Allowed languages | `settings` | `languages` (e.g. `["en"]`) |
| Default language | `settings` | `default_language` |
| Service error message | `settings` | `message_error` |
| Assistant offline message | `settings` | `message_offline` |
| Daily transcript email | `settings` | `digest_enabled` (bool), `digest_email` |
| Lead notification email | `settings` | `lead_email` |
| Contact phone / second phone | `settings` | `phone`, `phone_alt` |
| Business facts / knowledge prose | `knowledge` | `fields` — keys `intro`, `business`, `facts`, `faq`, `boundaries`, `privacy`, `extra_rules`, `hard_rules` |
| Service/topic areas | `knowledge` | `areas` — list of `{key, label, topic_name, topic_sub, icon, chip}`; keys `area_1`–`area_9` |
| FAQ / question bank | `knowledge` | `bank` — `{"area_N": [{"question", "answer"}]}`; keys must refer to an included or already configured area |
| Conversation templates (welcome) | `templates` | `greet` |
| Accent color | `appearance` | `accent` |
| Header background / text tone | `appearance` | `header_bg`, `header_text` |
| Header image / logo | `appearance` | `header_image`, `logo` |
| Position | `appearance` | `position` (`left`/`right`) |
| Side/bottom offsets | `appearance` | `offset_side`, `offset_bottom` (0–80) |
| Launcher size | `appearance` | `launcher_size` (44/48/56) |
| Make bot live | — not in the envelope | `POST /setup/go-live` only, after verification and approval |

Sections may be omitted for a partial setup. Values reuse the same domain
validation as the admin UI (provider IDs/models, language codes, icon IDs,
appearance values, emails, numbers, URLs) — a constraint from the guided
tables above applies unchanged to the matching envelope key. When the
`interview` capability is used, `GET /setup/interview/preview` returns a ready
`knowledge` envelope; prefer folding it in over hand-building the knowledge
section.

## Every plan row

For each field above, `configuration-plan.md` must record:

- proposed value or action;
- current non-secret value/status;
- source;
- approval state;
- target environment;
- personal/regulated-data classification;
- verification method;
- rollback value or action.
