import { useEffect, useRef } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup } from "codemirror";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  selectedComponent: string | null;
}

export function CodeEditor({ value, onChange, error, selectedComponent }: CodeEditorProps) {
  const editorRef = useRef<EditorView>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        xml(),
        oneDark,
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

  // Scroll to selected component
  useEffect(() => {
    if (!selectedComponent || !editorRef.current) return;

    const doc = editorRef.current.state.doc.toString();
    const componentPattern = new RegExp(`id="${selectedComponent}"[^>]*>`, "i");
    const match = doc.match(componentPattern);

    if (match) {
      const pos = doc.indexOf(match[0]);
      const line = editorRef.current.state.doc.lineAt(pos);
      editorRef.current.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: 'center' })
      });
    }
  }, [selectedComponent]);

  return (
    <div className="h-full flex flex-col">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div ref={containerRef} className="flex-1 overflow-auto" />
    </div>
  );
}