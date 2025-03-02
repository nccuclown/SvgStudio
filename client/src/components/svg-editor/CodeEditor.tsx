import { useEffect, useRef } from "react";
import { EditorView, lineNumbers, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { xml } from "@codemirror/lang-xml";
import { basicSetup } from "codemirror";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";

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
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      },
      ".cm-gutters": {
        backgroundColor: "#1e1e1e",
        color: "#858585",
        border: "none",
        borderRight: "1px solid #404040"
      },
      ".cm-line": {
        padding: "0 4px"
      },
      ".cm-selectionBackground": {
        backgroundColor: "rgba(81, 92, 106, 0.4) !important"
      },
      ".cm-cursor": {
        borderLeftColor: "#fff"
      },
      "&.cm-focused": {
        outline: "none"
      },
      // XML 語法高亮
      ".cm-tagName": { color: "#569cd6" },
      ".cm-bracket": { color: "#808080" },
      ".cm-attributeName": { color: "#9cdcfe" },
      ".cm-attributeValue": { color: "#ce9178" },
      ".cm-comment": { color: "#6a9955" },
      ".cm-string": { color: "#ce9178" },
      ".cm-number": { color: "#b5cea8" }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        xml(),
        theme,
        lineNumbers(),
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.lineWrapping,
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
      className="h-full w-full overflow-hidden"
    />
  );
}