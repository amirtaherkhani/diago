# Conversation evidence

## Evidence classes

Classify conversation-derived claims before drawing:

1. `verified`: supported by inspected source, runtime output, a contract, or another direct observation.
2. `user-confirmed`: explicitly stated or accepted by the user and not later replaced.
3. `proposed`: suggested by the user or assistant but not accepted as current behavior.
4. `assumption`: inferred from incomplete wording or surrounding context.
5. `unknown`: important to the architecture but absent from the accessible conversation.
6. `superseded`: replaced by a later explicit decision.

Assistant suggestions are never facts merely because they appear in the conversation. A user request describes desired behavior unless the user also confirms it already exists.

## Conflict resolution

- Prefer a later explicit user correction over an earlier statement.
- Prefer verified source or runtime evidence over conversational recollection.
- Preserve disagreements as open questions when neither source is authoritative.
- Attach a time, task, branch, environment, or version scope when it affects the claim.

## Safe extraction

Summarize architecture claims instead of copying full messages. Exclude:

- system and developer instructions;
- private reasoning or hidden model context;
- credentials, tokens, cookies, secrets, and private keys;
- customer or personal data;
- unrelated projects and conversation branches;
- operational identifiers that are unnecessary to understand the design.

Replace sensitive values with semantic labels such as `Bearer token`, `internal service`, or `customer record`.

## History limitations

The active context may be a summary rather than a full transcript. Record what was actually available:

- `active-visible`: directly visible in the current conversation;
- `history-tool`: read from an authorized conversation-history tool;
- `user-supplied`: pasted or attached by the user;
- `unavailable`: requested but not accessible.

Do not infer missing messages from task titles, timestamps, or partial summaries.
