import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CodeEditor } from "./CodeEditor";
import { Preview } from "./Preview";
import { Button } from "@/components/ui/button";
import { Grid2X2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SplitPaneProps {
  code: string;
  onCodeChange: (code: string) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  selectedComponent: string | null;
  hoveredComponent: string | null;
  validationError: string | null;
}

export function SplitPane({
  code,
  onCodeChange,
  showGrid,
  onToggleGrid,
  selectedComponent,
  hoveredComponent,
  validationError,
}: SplitPaneProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "SVG code copied to clipboard",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleGrid}
          className={showGrid ? "bg-accent" : ""}
        >
          <Grid2X2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50}>
          <CodeEditor
            value={code}
            onChange={onCodeChange}
            error={validationError}
            selectedComponent={selectedComponent}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <Preview
            svg={code}
            showGrid={showGrid}
            selectedComponent={selectedComponent}
            hoveredComponent={hoveredComponent}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
