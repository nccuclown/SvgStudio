import { cn } from "@/lib/utils";

interface PreviewProps {
  svg: string;
  showGrid: boolean;
  selectedComponent: string | null;
  hoveredComponent: string | null;
  isFullscreen: boolean;
}

export function Preview({
  svg,
  showGrid,
  selectedComponent,
  hoveredComponent,
  isFullscreen,
}: PreviewProps) {
  return (
    <div className={cn(
      "h-full w-full overflow-auto",
      showGrid && "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMjgsIDEyOCwgMTI4LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"
    )}>
      <div className={cn(
        "min-h-full flex items-center justify-center p-8",
        isFullscreen && "min-h-screen"
      )}>
        <div 
          dangerouslySetInnerHTML={{
            __html: svg
              .replace(
                new RegExp(`id="${selectedComponent}"`, "g"),
                `id="${selectedComponent}" style="outline: 2px solid hsl(var(--primary)); outline-offset: 2px;"`
              )
              .replace(
                new RegExp(`id="${hoveredComponent}"`, "g"),
                `id="${hoveredComponent}" style="outline: 2px solid hsl(var(--accent)); outline-offset: 2px;"`
              ),
          }}
        />
      </div>
    </div>
  );
}