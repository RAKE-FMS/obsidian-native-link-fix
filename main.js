const { Plugin } = require('obsidian');

/**
 * Fixes only Markdown links emitted immediately after Obsidian's native [[...]]
 * completion. Does not replace the built-in suggestion provider.
 */
module.exports = class NativeLinkFix extends Plugin {
  onload() {
    this.pending = new WeakMap();
    this.rewriting = false;

    this.registerEvent(
      this.app.workspace.on('editor-change', (editor) => {
        if (this.rewriting) return;
        this.onEditorChange(editor);
      })
    );
  }

  onEditorChange(editor) {
    // Remember the position of an unfinished native [[-link.
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const prefix = line.slice(0, cursor.ch);
    const opening = prefix.lastIndexOf('[[');
    const trailing = opening < 0 ? '' : prefix.slice(opening + 2);

    if (
      opening >= 0 &&
      prefix[opening - 1] !== '\\' &&
      prefix[opening - 1] !== '!' &&
      !/[\[\]\r\n]/.test(trailing)
    ) {
      this.pending.set(editor, { line: cursor.line, ch: opening });
      return;
    }

    const pending = this.pending.get(editor);
    this.pending.delete(editor);
    if (!pending || pending.line >= editor.lineCount()) return;

    const completedLine = editor.getLine(pending.line);
    // Strictly anchor to the original [[ position to avoid unrelated links.
    const after = completedLine.slice(pending.ch);
    const match = /^\[([^\]\r\n]*)\]\((<[^>\r\n]+>|[^)\r\n]+)\)/.exec(after);
    if (!match) return;

    const fixed = this.fixLink(match[1], match[2]);
    if (!fixed || fixed === match[0]) return;

    this.rewriting = true;
    try {
      editor.replaceRange(
        fixed,
        { line: pending.line, ch: pending.ch },
        { line: pending.line, ch: pending.ch + match[0].length }
      );
    } finally {
      this.rewriting = false;
    }
  }

  fixLink(label, destination) {
    const enclosed = destination.startsWith('<') && destination.endsWith('>');
    const raw = enclosed ? destination.slice(1, -1) : destination;

    // Absolute, external, anchor-only, Obsidian URI links are not note paths.
    if (/^[a-z][a-z\d+.-]*:/i.test(raw) || raw.startsWith('//') || raw.startsWith('#')) {
      return null;
    }

    // Preserve heading/block anchors, e.g. Note#Title, Note#^block-id.
    const hash = raw.indexOf('#');
    const path = hash < 0 ? raw : raw.slice(0, hash);
    const fragment = hash < 0 ? '' : raw.slice(hash);
    if (!path || path.endsWith('/') || path.startsWith('?')) return null;

    const lastComponent = path.split('/').pop() || '';
    const lower = lastComponent.toLowerCase();

    // If there is already a file extension, leave it unchanged. This avoids
    // accidentally turning media links such as photo.png into photo.png.md.
    // Consequence: extension-like note names such as "Version.2" are skipped.
    const hasExtension = /\.[^./]+$/.test(lastComponent);
    const notePath = hasExtension ? path : path + '.md';

    let visible = label;
    if (!visible.trim()) {
      let basename = lastComponent;
      try { basename = decodeURIComponent(basename); } catch (_) { /* preserve raw */ }
      basename = basename.replace(/\.(md|markdown)$/i, '');
      visible = basename.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    }
    if (!visible) return null;

    const nextTarget = notePath + fragment;
    const wrapped = enclosed ? `<${nextTarget}>` : nextTarget;
    return `[${visible}](${wrapped})`;
  }
};
