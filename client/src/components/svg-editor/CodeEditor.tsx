import { useEffect, useRef } from "react";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
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

    // 設置編輯器主題和基本樣式
    const theme = EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "14px"
      },
      ".cm-content": {
        fontFamily: "monospace",
        backgroundColor: "var(--background)",
        color: "var(--foreground)"
      },
      ".cm-gutters": {
        backgroundColor: "var(--background)",
        color: "var(--muted-foreground)",
        border: "none"
      },
      "&.cm-focused": {
        outline: "none"
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        xml(),
        oneDark,
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
      className="h-full w-full overflow-hidden bg-background text-foreground"
    />
  );
}