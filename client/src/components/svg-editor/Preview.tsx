import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

interface PreviewProps {
  svgCode: string;
  showGrid: boolean;
  selectedComponentIds: string[];
  hoveredComponentId: string | null;
  isFullscreen?: boolean;
}

export function Preview({
  svgCode,
  showGrid,
  selectedComponentIds,
  hoveredComponentId,
  isFullscreen = false,
}: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // 縮放控制函數
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  };

  // 全螢幕控制
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // 監聽全螢幕狀態變化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 高亮選中和懸停的元素
  useEffect(() => {
    if (!containerRef.current) return;

    const preview = containerRef.current.querySelector(".svg-preview");
    if (!preview) return;

    const svgElement = preview.querySelector("svg");
    if (!svgElement) return;

    try {
      // 移除所有現有的高亮樣式
      const allElements = svgElement.querySelectorAll("[data-highlight]");
      allElements.forEach(el => {
        el.removeAttribute("data-highlight");
      });

      // 高亮懸停元素
      if (hoveredComponentId) {
        let hoveredElement = svgElement.querySelector(`#${hoveredComponentId}`);

        // 如果直接查找失敗，嘗試階層查找
        if (!hoveredElement && hoveredComponentId.includes('-')) {
          const parts = hoveredComponentId.split('-');
          if (parts.length >= 3) {
            const groupId = parts[0];
            const elementType = parts[1];
            const elementIndex = parseInt(parts[2], 10);

            const groupElement = svgElement.querySelector(`#${groupId}`);
            if (groupElement) {
              const matchingElements = Array.from(groupElement.querySelectorAll(elementType));
              if (elementIndex < matchingElements.length) {
                hoveredElement = matchingElements[elementIndex];
              }
            }
          }
        }

        if (hoveredElement) {
          hoveredElement.setAttribute("data-highlight", "hover");
        }
      }

      // 高亮選中的元素
      selectedComponentIds.forEach(id => {
        let selectedElement = svgElement.querySelector(`#${id}`);

        // 如果直接查找失敗，嘗試階層查找
        if (!selectedElement && id.includes('-')) {
          const parts = id.split('-');
          if (parts.length >= 3) {
            const groupId = parts[0];
            const elementType = parts[1];
            const elementIndex = parseInt(parts[2], 10);

            const groupElement = svgElement.querySelector(`#${groupId}`);
            if (groupElement) {
              const matchingElements = Array.from(groupElement.querySelectorAll(elementType));
              if (elementIndex < matchingElements.length) {
                selectedElement = matchingElements[elementIndex];
              }
            }
          }
        }

        if (selectedElement) {
          selectedElement.setAttribute("data-highlight", "selected");
        }
      });
    } catch (error) {
      console.error("元素高亮處理錯誤:", error);
    }
  }, [selectedComponentIds, hoveredComponentId, svgCode]);

  // 準備SVG代碼，添加高亮樣式
  const enhancedSvg = `
    <style>
      [data-highlight="selected"] {
        outline: 3px solid hsl(var(--primary));
        outline-offset: 2px;
      }
      [data-highlight="hover"] {
        outline: 2px dashed hsl(var(--primary));
        outline-offset: 2px;
      }
    </style>
    ${svgCode}
  `;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "h-full w-full overflow-auto relative",
        showGrid && "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMDAsIDEwMCwgMTAwLCAwLjIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"
      )}
    >
      {/* 控制按鈕 */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="hover:bg-accent"
          title="縮小"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="hover:bg-accent"
          title="放大"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullScreen}
          className="hover:bg-accent"
          title={isFullScreen ? "退出全螢幕" : "進入全螢幕"}
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className={cn(
        "min-h-full flex items-center justify-center p-4",
        isFullScreen ? "min-h-screen" : ""
      )}>
        <div 
          className={cn(
            "svg-preview max-w-full max-h-full overflow-auto bg-white dark:bg-gray-900 rounded-md shadow-sm",
            isFullScreen ? "w-[90vw] h-[90vh]" : "w-full h-full"
          )}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-in-out'
          }}
          dangerouslySetInnerHTML={{ __html: enhancedSvg }}
        />
      </div>
    </div>
  );
}