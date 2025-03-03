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
  component: SVGComponent | null;
  onPropertyChange: (id: string, property: string, value: string) => void;
}

// 屬性分類
const BASIC_PROPS = ['x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'd', 'points'];
const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity'];
const TEXT_PROPS = ['_text', 'text-anchor', 'font-family', 'font-size', 'font-weight'];
const ANIMATION_PROPS = ['dur', 'repeatCount', 'values', 'attributeName', 'begin', 'from', 'to', 'keyTimes', 'keySplines'];

// 修正：永遠返回一個字符串，避免null導致的渲染問題
function buildElementPath(component: SVGComponent | null): string {
  if (!component) return '';

  const parts = [];

  // 解析ID獲取層級關係
  if (component.id.includes('-')) {
    const idParts = component.id.split('-');
    // 如果ID形如 "parent-type-index"
    if (idParts.length >= 3) {
      parts.push(idParts[0]);
    }
  }

  parts.push(component.type);

  return parts.join(' > ');
}

export function PropertyPanel({
  component,
  onPropertyChange
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
    if (!component) return emptyGroups;

    const attributes = component.attributes;
    const groups = {
      basic: [] as [string, string][],
      style: [] as [string, string][],
      text: [] as [string, string][],
      animation: [] as [string, string][],
      other: [] as [string, string][]
    };

    Object.entries(attributes).forEach(([key, value]) => {
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
  }, [component]);

  const fullPath = component ? buildElementPath(component) : '未選擇元件';

  if (!component) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        選擇一個元件來查看屬性
      </div>
    );
  }

  const renderPropertyEditor = (property: string, value: string) => {
    const handleChange = (newValue: string) => {
      console.log(`[PropertyPanel] 屬性變更:`, {
        componentId: component.id,
        property,
        oldValue: value,
        newValue
      });

      try {
        const actualValue = newValue === '' ? '0' : newValue;
        const actualProperty = property.startsWith('style-') ? property : property;
        onPropertyChange(component.id, actualProperty, actualValue);
        setLastUpdateStatus('success');
      } catch (error) {
        console.error(`[PropertyPanel] 屬性更新失敗:`, error);
        setLastUpdateStatus('error');
      }
    };

    // 顏色屬性需要顏色選擇器
    if (property === 'fill' || property === 'stroke' || property === 'style-fill' || property === 'style-stroke') {
      return (
        <div className="flex gap-2">
          <Input
            type="color"
            value={value}
            className="w-12"
            onChange={(e) => handleChange(e.target.value)}
          />
          <Input
            value={value}
            className="flex-1"
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
      );
    }

    // 路徑數據需要多行文本框
    else if (property === 'd' || property === 'points' || property === '_text') {
      return (
        <Textarea
          value={value}
          rows={4}
          onChange={(e) => handleChange(e.target.value)}
        />
      );
    }

    // 數值屬性使用文本輸入框，外部添加上下調整按鈕
    else if (
      ['width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'opacity', 'stroke-width']
        .includes(property) || property.match(/^style-(opacity|stroke-width)$/)
    ) {
      return (
        <div className="flex gap-2 items-center">
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1"
          />
          <div className="flex flex-col">
            <Button
              variant="outline"
              size="icon"
              className="h-5 px-2 rounded-b-none hover:bg-accent"
              onClick={() => {
                const step = property.includes('opacity') ? 0.1 : 1;
                const newValue = parseFloat(value) + step;
                if (property.includes('opacity') && newValue > 1) return;
                handleChange(newValue.toString());
              }}
            >
              ▲
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-5 px-2 rounded-t-none border-t-0 hover:bg-accent"
              onClick={() => {
                const step = property.includes('opacity') ? 0.1 : 1;
                const newValue = Math.max(parseFloat(value) - step, 0);
                handleChange(newValue.toString());
              }}
            >
              ▼
            </Button>
          </div>
        </div>
      );
    }

    // 默認使用文本輸入框
    else {
      return (
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        />
      );
    }
  };

  const renderPropertyGroup = (properties: [string, string][]) => {
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
          {component?.type} <span className="text-muted-foreground">({component?.id})</span>
        </h3>
        <div className="text-xs text-muted-foreground mt-1 bg-muted p-1 rounded">
          <span className="font-mono">完整路徑: {fullPath}</span>
        </div>
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