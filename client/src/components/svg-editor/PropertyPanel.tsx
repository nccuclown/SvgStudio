import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PropertyPanelProps {
  selectedComponent: string | null;
  svg: string;
  onPropertyChange: (id: string, property: string, value: string) => void;
}

interface SVGElementProperties {
  id: string;
  type: string;
  properties: Record<string, string>;
}

export function PropertyPanel({
  selectedComponent,
  svg,
  onPropertyChange,
}: PropertyPanelProps) {
  const [elementProperties, setElementProperties] = useState<SVGElementProperties | null>(null);

  useEffect(() => {
    if (!selectedComponent) {
      setElementProperties(null);
      return;
    }

    // Parse SVG string to get element properties
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const element = doc.getElementById(selectedComponent);

    if (!element) {
      setElementProperties(null);
      return;
    }

    // Get all attributes of the element
    const properties: Record<string, string> = {};
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name !== "id") {
        properties[attr.name] = attr.value;
      }
    });

    setElementProperties({
      id: selectedComponent,
      type: element.tagName.toLowerCase(),
      properties,
    });
  }, [selectedComponent, svg]);

  if (!elementProperties) {
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
            {elementProperties.type} ({elementProperties.id})
          </h3>
        </div>
        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="space-y-4 pr-4">
            {Object.entries(elementProperties.properties).map(([key, value]) => (
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
                        onPropertyChange(elementProperties.id, key, e.target.value)
                      }
                    />
                    <Input
                      id={key}
                      value={value}
                      onChange={(e) =>
                        onPropertyChange(elementProperties.id, key, e.target.value)
                      }
                    />
                  </div>
                ) : (
                  <Input
                    id={key}
                    value={value}
                    onChange={(e) =>
                      onPropertyChange(elementProperties.id, key, e.target.value)
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