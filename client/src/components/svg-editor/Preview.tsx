import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PreviewProps {
  svgCode: string;
  showGrid: boolean;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  isFullscreen?: boolean;
}

export function Preview({
  svgCode,
  showGrid,
  selectedComponentId,
  hoveredComponentId,
  isFullscreen = false,
}: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 高亮選中和懸停的元素
  useEffect(() => {
    if (!containerRef.current) return;

    const preview = containerRef.current.querySelector(".svg-preview");
    if (!preview) return;

    // 查找SVG元素
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
        const hoveredElement = svgElement.querySelector(`#${hoveredComponentId}`);
        if (hoveredElement) {
          hoveredElement.setAttribute("data-highlight", "hover");
        }
      }

      // 高亮選中元素
      if (selectedComponentId) {
        const selectedElement = svgElement.querySelector(`#${selectedComponentId}`);
        if (selectedElement) {
          selectedElement.setAttribute("data-highlight", "selected");
        }
      }
    } catch (error) {
      console.error("元素高亮處理錯誤:", error);
    }
  }, [selectedComponentId, hoveredComponentId, svgCode]);

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
      <div className={cn(
        "min-h-full flex items-center justify-center p-4",
        isFullscreen ? "min-h-screen" : ""
      )}>
        <div 
          className={cn(
            "svg-preview max-w-full max-h-full overflow-auto bg-white dark:bg-gray-900 rounded-md shadow-sm",
            isFullscreen ? "w-[90vw] h-[90vh]" : "w-full h-full"
          )}
          dangerouslySetInnerHTML={{ __html: enhancedSvg }}
        />
      </div>
    </div>
  );
}