# Native Markdown Link Fix

Preserves Obsidian's **built-in** `[[` completion menu. After it emits a Markdown link, this plugin corrects two cases:

- `[](New%20Note)` -> `[New Note](New%20Note.md)`
- `[New Note](New%20Note)` -> `[New Note](New%20Note.md)`

Valid links, external URLs, and links to files with explicit extensions are left alone. Link aliases are preserved. Existing notes are not batch-rewritten.

## Installation

1. Turn off **Settings -> Files and links -> Use [[Wikilinks]]** in Obsidian.
2. Copy `main.js` and `manifest.json` to `<vault>/.obsidian/plugins/native-markdown-link-fix/`.
3. Reload Obsidian and enable **Native Markdown Link Fix** under Community plugins.
4. Type `[[New Note`, then choose a built-in suggestion or press Enter.

## Scope / limitations

- This is an experimental plugin. It has been tested with a mock editor, **not** in a running Obsidian instance.
- Repairs only links generated after an unfinished `[[` was observed in the current editor. It does not rewrite existing documents.
- The link must appear at the original `[[` location in the same line. This covers typical native completions.
- Destinations that already look like they have an extension (e.g. `Chapter.v2`) are deliberately left unchanged, to avoid altering attachments. Such note names would need a more advanced file-resolution strategy.
- Complicated link labels with literal `]`, destinations with literal `)`, and multi-step editor transactions are outside the simple parser's scope.
- If pressing Enter produces a newline and no Markdown link at all, the plugin does not create one or override that keybinding.
- Test in a throwaway vault before enabling in your main vault. Desktop and mobile compatibility have not been verified.
