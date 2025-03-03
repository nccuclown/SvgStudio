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
import { 
  Grid,
  Image,
  Code,
  Maximize,
  Minimize,
  Copy,
  Clipboard,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { findComponentById } from "@/lib/svg-utils";

export default function Editor() {
  const {
    originalSvgCode,
    setOriginalSvgCode,
    processedSvgCode,
    components,
    fullComponents,
    selectedComponentId,
    selectComponent,
    hoveredComponentId,
    hoverComponent,
    showGrid,
    toggleGrid,
    updateComponentProperty,
    copyComponent,
    pasteComponent,
    moveComponentLayer,
    hasCopiedElement
  } = useSvgEditor();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedComponent = selectedComponentId 
    ? findComponentById(fullComponents, selectedComponentId)
    : null;

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
          {/* 元素管理按鈕 */}
          <Button
            variant="outline"
            size="icon"
            onClick={copyComponent}
            disabled={!selectedComponentId}
            className="hover:bg-accent"
            title="複製元素"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={pasteComponent}
            disabled={!hasCopiedElement}
            className="hover:bg-accent"
            title="粘貼元素"
          >
            <Clipboard className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveComponentLayer('up')}
            disabled={!selectedComponentId}
            className="hover:bg-accent"
            title="上移一層"
          >
            <ArrowUpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveComponentLayer('down')}
            disabled={!selectedComponentId}
            className="hover:bg-accent"
            title="下移一層"
          >
            <ArrowDownCircle className="h-4 w-4" />
          </Button>
          {/* 原有的按鈕 */}
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
                <TabsTrigger value="original">
                  <Code className="h-4 w-4 mr-2" />
                  原始代碼
                </TabsTrigger>
                <TabsTrigger value="processed">
                  <Code className="h-4 w-4 mr-2" />
                  處理後代碼
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 p-0">
              <Preview
                svgCode={processedSvgCode}
                showGrid={showGrid}
                selectedComponentId={selectedComponentId}
                hoveredComponentId={hoveredComponentId}
                isFullscreen={isFullscreen}
              />
            </TabsContent>

            <TabsContent value="original" className="flex-1 p-0">
              <CodeEditor
                value={originalSvgCode}
                onChange={setOriginalSvgCode}
                selectedComponent={selectedComponentId}
              />
            </TabsContent>

            <TabsContent value="processed" className="flex-1 p-0">
              <CodeEditor
                value={processedSvgCode}
                readOnly={true}
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