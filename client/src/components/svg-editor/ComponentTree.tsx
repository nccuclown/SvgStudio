import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComponentTreeProps {
  components: Array<{ id: string; type: string }>;
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  onHoverComponent: (id: string | null) => void;
}

export function ComponentTree({
  components,
  selectedComponent,
  onSelectComponent,
  onHoverComponent,
}: ComponentTreeProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold mb-4">Components</h2>
        {components.map((component) => (
          <Button
            key={component.id}
            variant="ghost"
            className={cn(
              "w-full justify-start",
              selectedComponent === component.id && "bg-accent"
            )}
            onMouseEnter={() => onHoverComponent(component.id)}
            onMouseLeave={() => onHoverComponent(null)}
            onClick={() => onSelectComponent(component.id)}
          >
            {component.type} ({component.id})
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
