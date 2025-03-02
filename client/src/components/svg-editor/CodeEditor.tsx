import { useEffect, useRef } from "react";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { xml } from "@codemirror/lang-xml";
import { basicSetup } from "codemirror";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  selectedComponent: string | null;
}

export function CodeEditor({
  value,
  onChange,
  selectedComponent
}: CodeEditorProps) {
  const editorRef = useRef<EditorView>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 自定義主題
    const theme = EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "14px",
      },
      ".cm-content": {
        fontFamily: "monospace",
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        caretColor: "hsl(var(--primary))"
      },
      ".cm-gutters": {
        backgroundColor: "hsl(var(--muted))",
        color: "hsl(var(--muted-foreground))",
        border: "none",
        borderRight: "1px solid hsl(var(--border))"
      },
      ".cm-line": {
        padding: "0 4px"
      },
      ".cm-selectionBackground": {
        backgroundColor: "hsl(var(--accent)/.5) !important"
      },
      ".cm-cursor": {
        borderLeftColor: "hsl(var(--primary))"
      },
      "&.cm-focused": {
        outline: "none"
      },
      // 語法高亮
      ".cm-keyword": { color: "hsl(var(--primary))" },
      ".cm-tag": { color: "hsl(var(--secondary))" },
      ".cm-attribute": { color: "hsl(var(--accent))" },
      ".cm-string": { color: "hsl(var(--success))" },
      ".cm-number": { color: "hsl(var(--warning))" },
      ".cm-comment": { color: "hsl(var(--muted-foreground))" }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        xml(),
        theme,
        lineNumbers(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // 更新編輯器內容
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.state.doc.toString()) {
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  // 滾動到選中的組件
  useEffect(() => {
    if (!selectedComponent || !editorRef.current) return;

    const doc = editorRef.current.state.doc.toString();
    const componentPattern = new RegExp(`id="${selectedComponent}"[^>]*>`, "i");
    const match = doc.match(componentPattern);

    if (match) {
      const pos = doc.indexOf(match[0]);
      const line = editorRef.current.state.doc.lineAt(pos);
      editorRef.current.dispatch({
        effects: EditorView.scrollIntoView(line.from, {
          y: 'center',
          yMargin: 50
        })
      });
    }
  }, [selectedComponent]);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full overflow-hidden border rounded-md"
    />
  );
}