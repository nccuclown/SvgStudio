import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CodeEditor } from "./CodeEditor";
import { Preview } from "./Preview";
import { Button } from "@/components/ui/button";
import { Grid2X2, Copy, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
      title: "已複製",
      description: "SVG 代碼已複製到剪貼板",
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onToggleGrid}
            className="hover:bg-accent"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleCopy}
            className="hover:bg-accent"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleFullscreen}
            className="hover:bg-accent"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <Preview
          svgCode={code}
          showGrid={showGrid}
          selectedComponentId={selectedComponent}
          hoveredComponentId={hoveredComponent}
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
          className={cn("hover:bg-accent", showGrid && "bg-accent")}
        >
          <Grid2X2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleCopy}
          className="hover:bg-accent"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleFullscreen}
          className="hover:bg-accent"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={30} minSize={20}>
          <CodeEditor
            value={code}
            onChange={onCodeChange}
            selectedComponent={selectedComponent}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70} minSize={50}>
          <Preview
            svgCode={code}
            showGrid={showGrid}
            selectedComponentId={selectedComponent}
            hoveredComponentId={hoveredComponent}
            isFullscreen={false}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}