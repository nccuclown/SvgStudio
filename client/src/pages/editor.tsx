import { useState } from "react";
import { useSvgEditor } from "@/hooks/use-svg-editor";
import { ComponentTree } from "@/components/svg-editor/ComponentTree";
import { Preview } from "@/components/svg-editor/Preview";
import { PropertyPanel } from "@/components/svg-editor/PropertyPanel";
import { CodeEditor } from "@/components/svg-editor/CodeEditor";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, Image, Maximize, Minimize } from "lucide-react";
import { findComponentById } from "@/lib/svg-utils";

export default function Editor() {
  const {
    svgCode,
    setSvgCode,
    components,
    fullComponents,
    selectedComponentId,
    selectComponent,
    hoveredComponentId,
    hoverComponent,
    showGrid,
    toggleGrid,
    updateComponentProperty,
  } = useSvgEditor();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // 獲取選中的組件詳情
  const selectedComponent = selectedComponentId 
    ? findComponentById(fullComponents, selectedComponentId)
    : null;

  // 切換全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* 頂部工具欄 */}
      <div className="border-b p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl">SVG編輯器</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={toggleGrid}>
            <Grid className={`h-4 w-4 ${showGrid ? "text-primary" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 主要內容區域 */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* 左側面板 - 組件樹 */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full border-r">
            <ComponentTree
              components={components}
              selectedComponent={selectedComponentId}
              onSelectComponent={selectComponent}
              onHoverComponent={hoverComponent}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* 中間面板 - 預覽和代碼 */}
        <ResizablePanel defaultSize={55}>
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="preview">
                  <Image className="h-4 w-4 mr-2" />
                  預覽
                </TabsTrigger>
                <TabsTrigger value="code">
                  <svg
                    className="h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  代碼
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 p-0">
              <Preview
                svgCode={svgCode}
                showGrid={showGrid}
                selectedComponentId={selectedComponentId}
                hoveredComponentId={hoveredComponentId}
                isFullscreen={isFullscreen}
              />
            </TabsContent>

            <TabsContent value="code" className="flex-1 p-0">
              <CodeEditor
                value={svgCode}
                onChange={setSvgCode}
                selectedComponent={selectedComponentId}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle />

        {/* 右側面板 - 屬性編輯 */}
        <ResizablePanel defaultSize={25} minSize={15}>
          <div className="h-full border-l">
            <PropertyPanel
              component={selectedComponent}
              onPropertyChange={updateComponentProperty}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}