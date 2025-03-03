import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SVGComponent } from "@/lib/svg-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyPanelProps {
  components: SVGComponent[] | null;
  commonProperties: Record<string, string | null> | null;
  onPropertyChange: (id: string, property: string, value: string) => void;
  onBatchUpdate: (property: string, operation: 'increase' | 'decrease', amount: number) => void;
}

// 屬性分類
const BASIC_PROPS = ['x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'd', 'points'];
const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity'];
const TEXT_PROPS = ['_text', 'text-anchor', 'font-family', 'font-size', 'font-weight'];
const ANIMATION_PROPS = ['dur', 'repeatCount', 'values', 'attributeName', 'begin', 'from', 'to', 'keyTimes', 'keySplines'];

// 可以批量調整的屬性
const NUMERIC_PROPS = ['width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'opacity'];

function buildElementPath(component: SVGComponent): string {
  if (!component) return '';

  const parts = [];

  if (component.id.includes('-')) {
    const idParts = component.id.split('-');
    if (idParts.length >= 3) {
      parts.push(idParts[0]);
    }
  }

  parts.push(component.type);

  return parts.join(' > ');
}

export function PropertyPanel({
  components,
  commonProperties,
  onPropertyChange,
  onBatchUpdate
}: PropertyPanelProps) {
  const [lastUpdateStatus, setLastUpdateStatus] = useState<'success' | 'error' | null>(null);

  const emptyGroups = {
    basic: [],
    style: [],
    text: [],
    animation: [],
    other: []
  };

  const propertyGroups = useMemo(() => {
    if (!commonProperties) return emptyGroups;

    const groups = {
      basic: [] as [string, string | null][],
      style: [] as [string, string | null][],
      text: [] as [string, string | null][],
      animation: [] as [string, string | null][],
      other: [] as [string, string | null][]
    };

    Object.entries(commonProperties).forEach(([key, value]) => {
      if (BASIC_PROPS.includes(key)) {
        groups.basic.push([key, value]);
      } else if (STYLE_PROPS.includes(key) || key.startsWith('style-')) {
        groups.style.push([key, value]);
      } else if (TEXT_PROPS.includes(key)) {
        groups.text.push([key, value]);
      } else if (ANIMATION_PROPS.includes(key)) {
        groups.animation.push([key, value]);
      } else if (key !== 'id') {
        groups.other.push([key, value]);
      }
    });

    return groups;
  }, [commonProperties]);

  if (!components || components.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        選擇一個或多個元件來查看屬性
      </div>
    );
  }

  const renderPropertyEditor = (property: string, value: string | null) => {
    // 如果是數值類型的屬性，顯示批量調整按鈕
    if (NUMERIC_PROPS.includes(property)) {
      const step = property.includes('opacity') ? 0.1 : 1;
      return (
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            {value === null ? (
              <div className="text-sm text-muted-foreground italic">
                多個不同的值
              </div>
            ) : (
              <Input
                value={value}
                onChange={(e) => {
                  if (components.length === 1) {
                    onPropertyChange(components[0].id, property, e.target.value);
                  }
                }}
                readOnly={components.length > 1}
                className="flex-1"
              />
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBatchUpdate(property, 'decrease', step)}
              className="px-2 hover:bg-accent"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBatchUpdate(property, 'increase', step)}
              className="px-2 hover:bg-accent"
            >
              +
            </Button>
          </div>
        </div>
      );
    }

    // 顏色屬性
    if (property === 'fill' || property === 'stroke' || property === 'style-fill' || property === 'style-stroke') {
      return (
        <div className="flex gap-2">
          <Input
            type="color"
            value={value || ''}
            className="w-12"
            onChange={(e) => {
              if (components.length === 1) {
                onPropertyChange(components[0].id, property, e.target.value);
              }
            }}
            disabled={components.length > 1}
          />
          <Input
            value={value || ''}
            onChange={(e) => {
              if (components.length === 1) {
                onPropertyChange(components[0].id, property, e.target.value);
              }
            }}
            readOnly={components.length > 1}
            className="flex-1"
          />
        </div>
      );
    }

    // 路徑數據需要多行文本框
    if (property === 'd' || property === 'points' || property === '_text') {
      return (
        <Textarea
          value={value || ''}
          rows={4}
          onChange={(e) => {
            if (components.length === 1) {
              onPropertyChange(components[0].id, property, e.target.value);
            }
          }}
          readOnly={components.length > 1}
        />
      );
    }

    // 默認使用文本輸入框
    return (
      <Input
        value={value || ''}
        onChange={(e) => {
          if (components.length === 1) {
            onPropertyChange(components[0].id, property, e.target.value);
          }
        }}
        readOnly={components.length > 1}
      />
    );
  };

  const renderPropertyGroup = (properties: [string, string | null][]) => {
    if (properties.length === 0) {
      return (
        <div className="text-sm text-muted-foreground py-2">
          無可用屬性
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {properties.map(([property, value]) => (
          <div key={property} className="grid gap-2">
            <Label htmlFor={property}>{property}</Label>
            {renderPropertyEditor(property, value)}
          </div>
        ))}
      </div>
    );
  };

  const visibleTabs = [
    { id: 'basic', label: '基本', content: propertyGroups.basic },
    { id: 'style', label: '樣式', content: propertyGroups.style },
    ...(propertyGroups.text.length ? [{ id: 'text', label: '文本', content: propertyGroups.text }] : []),
    ...(propertyGroups.animation.length ? [{ id: 'animation', label: '動畫', content: propertyGroups.animation }] : []),
    ...(propertyGroups.other.length ? [{ id: 'other', label: '其他', content: propertyGroups.other }] : [])
  ];

  return (
    <div className="p-4 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-medium">
          {components.length > 1 
            ? `已選擇 ${components.length} 個元件`
            : `${components[0].type} (${components[0].id})`
          }
        </h3>
        {components.length === 1 && (
          <div className="text-xs text-muted-foreground mt-1 bg-muted p-1 rounded">
            <span className="font-mono">完整路徑: {buildElementPath(components[0])}</span>
          </div>
        )}
      </div>

      {lastUpdateStatus === 'error' && (
        <Alert variant="destructive" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            無法更新屬性，請檢查元素ID是否正確
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic">
        <TabsList className="grid grid-cols-3 mb-4">
          {visibleTabs.slice(0, 3).map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleTabs.length > 3 && (
          <TabsList className="grid grid-cols-2 mb-4">
            {visibleTabs.slice(3).map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <ScrollArea className="h-[calc(100vh-220px)]">
          {visibleTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="p-1">
              {renderPropertyGroup(tab.content)}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
}