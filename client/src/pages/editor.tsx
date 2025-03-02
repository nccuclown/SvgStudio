import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SplitPane } from "@/components/svg-editor/SplitPane";
import { ComponentTree } from "@/components/svg-editor/ComponentTree";
import { PropertyPanel } from "@/components/svg-editor/PropertyPanel";
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
    validationError,
    updateElementProperty,
  } = useSvgEditor();

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full flex flex-col border-r">
            <div className="flex-1 p-4">
              <ComponentTree
                components={components}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                onHoverComponent={setHoveredComponent}
              />
            </div>
            <PropertyPanel
              selectedComponent={selectedComponent}
              svg={code}
              onPropertyChange={updateElementProperty}
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