import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CodeEditor } from "./CodeEditor";
import { Preview } from "./Preview";
import { Button } from "@/components/ui/button";
import { Grid2X2, Copy, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "SVG code copied to clipboard",
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="outline" size="icon" onClick={onToggleGrid}>
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <Preview
          svg={code}
          showGrid={showGrid}
          selectedComponent={selectedComponent}
          hoveredComponent={hoveredComponent}
          isFullscreen={true}
        />
      </div>
    );
  }

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
        <Button variant="outline" size="icon" onClick={toggleFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={35} minSize={25}>
          <CodeEditor
            value={code}
            onChange={onCodeChange}
            error={validationError}
            selectedComponent={selectedComponent}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={65} minSize={45}>
          <Preview
            svg={code}
            showGrid={showGrid}
            selectedComponent={selectedComponent}
            hoveredComponent={hoveredComponent}
            isFullscreen={false}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}