import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyPanelProps {
  selectedComponent: string | null;
  svg: string;
  onPropertyChange: (id: string, property: string, value: string) => void;
  fullComponents?: Array<{
    id: string;
    type: string;
    attributes: Record<string, string>;
  }>;
}

export function PropertyPanel({
  selectedComponent,
  onPropertyChange,
  fullComponents = [],
}: PropertyPanelProps) {
  const selectedProperties = useMemo(() => {
    if (!selectedComponent || !fullComponents) return null;
    return fullComponents.find(comp => comp.id === selectedComponent);
  }, [selectedComponent, fullComponents]);

  if (!selectedProperties) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        選擇一個元件來查看屬性
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium">
            {selectedProperties.type} ({selectedProperties.id})
          </h3>
        </div>
        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="space-y-4 pr-4">
            {Object.entries(selectedProperties.attributes).map(([key, value]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>{key}</Label>
                {key === "fill" || key === "stroke" ? (
                  <div className="flex gap-2">
                    <Input
                      id={`${key}-color`}
                      type="color"
                      value={value}
                      className="w-[60px]"
                      onChange={(e) =>
                        onPropertyChange(selectedProperties.id, key, e.target.value)
                      }
                    />
                    <Input
                      id={key}
                      value={value}
                      onChange={(e) =>
                        onPropertyChange(selectedProperties.id, key, e.target.value)
                      }
                    />
                  </div>
                ) : (
                  <Input
                    id={key}
                    value={value}
                    onChange={(e) =>
                      onPropertyChange(selectedProperties.id, key, e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}