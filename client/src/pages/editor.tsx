import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SplitPane } from "@/components/svg-editor/SplitPane";
import { ComponentTree } from "@/components/svg-editor/ComponentTree";
import { useSvgEditor } from "@/hooks/use-svg-editor";

export default function Editor() {
  const {
    code,
    setCode,
    components,
    selectedComponent,
    setSelectedComponent,
    hoveredComponent,
    setHoveredComponent,
    showGrid,
    toggleGrid,
    validationError
  } = useSvgEditor();

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full p-4 border-r">
            <ComponentTree
              components={components}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
              onHoverComponent={setHoveredComponent}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80}>
          <SplitPane
            code={code}
            onCodeChange={setCode}
            showGrid={showGrid}
            onToggleGrid={toggleGrid}
            selectedComponent={selectedComponent}
            hoveredComponent={hoveredComponent}
            validationError={validationError}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
