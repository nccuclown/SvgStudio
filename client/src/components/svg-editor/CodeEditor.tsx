import { useRef, useEffect } from "react";
import Editor, { Monaco } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  selectedComponent: string | null;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  selectedComponent,
  readOnly = false
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // 配置 XML 格式化選項
    monaco.languages.registerDocumentFormattingEditProvider('xml', {
      provideDocumentFormattingEdits: (model) => {
        const text = model.getValue();
        const formatted = formatXML(text);
        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ];
      },
    });

    // 設置編輯器主題
    monaco.editor.defineTheme('svgEditor', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'tag', foreground: '569cd6' },
        { token: 'attribute.name', foreground: '9cdcfe' },
        { token: 'attribute.value', foreground: 'ce9178' },
        { token: 'comment', foreground: '6a9955' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
      }
    });

    monaco.editor.setTheme('svgEditor');
  };

  // 格式化 XML 代碼的輔助函數
  function formatXML(xml: string): string {
    let formatted = '';
    let indent = '';
    const tab = '  '; // 2 spaces
    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) {
        indent = indent.substring(tab.length);
      }
      formatted += indent + '<' + node + '>\r\n';
      if (node.match(/^<?\w[^>]*[^\/]$/)) {
        indent += tab;
      }
    });
    return formatted.substring(1, formatted.length - 3);
  }

  // 當選中組件改變時，高亮相關代碼
  const highlightSelectedComponent = () => {
    if (!selectedComponent || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const text = model.getValue();
    const regexp = new RegExp(`id="${selectedComponent}"[^>]*>`, 'i');
    const match = text.match(regexp);

    if (match) {
      const pos = text.indexOf(match[0]);
      const line = model.getPositionAt(pos).lineNumber;
      editorRef.current.revealLineInCenter(line);

      // 設置光標位置
      editorRef.current.setPosition({
        lineNumber: line,
        column: 1
      });
    }
  };

  // 當選中組件變化時，高亮代碼
  useEffect(() => {
    highlightSelectedComponent();
  }, [selectedComponent]);

  const handleChange = (value: string | undefined) => {
    // 防禦性檢查，確保onChange存在且接收到值
    if (onChange && typeof onChange === 'function' && value !== undefined) {
      onChange(value);
    }
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="xml"
      value={value}
      onChange={handleChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        readOnly: readOnly,
      }}
    />
  );
}