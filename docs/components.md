# 組件文檔

## ComponentTree
SVG元件層級結構導航組件。

### 功能
- 顯示SVG元素的層級結構
- 支持搜索和過濾
- 提供元素預覽信息
- 懸停和選擇功能

### 實現細節
```typescript
interface TreeNode {
  id: string;          // 元素ID
  type: string;        // 元素類型
  parentId?: string;   // 父元素ID
  attributes: Record<string, string>; // 元素屬性
  children: TreeNode[]; // 子元素
}

// 元素描述生成
function getElementDescription(node: TreeNode): string {
  // 提取位置信息
  const position = getPositionInfo(node.attributes);
  // 提取尺寸信息
  const size = getSizeInfo(node.attributes);
  // 提取樣式信息
  const style = getStyleInfo(node.attributes);
  return `${position} ${size} ${style}`;
}
```

## PropertyPanel
屬性編輯面板，用於修改SVG元素的屬性。

### 功能
- 顯示當前選中元素的所有屬性
- 支持不同類型的屬性編輯
- 即時預覽修改效果
- 驗證輸入值

### 實現細節
```typescript
// 屬性編輯器渲染
function renderPropertyEditor(
  property: string,
  value: string,
  onChange: (value: string) => void
) {
  // 根據屬性類型選擇適當的編輯器
  switch (getPropertyType(property)) {
    case 'color':
      return <ColorPicker value={value} onChange={onChange} />;
    case 'number':
      return <NumberInput value={value} onChange={onChange} />;
    case 'text':
      return <TextInput value={value} onChange={onChange} />;
    // ...其他類型
  }
}
```

## Preview
SVG預覽組件，提供即時可視化效果。

### 功能
- 渲染SVG內容
- 高亮顯示選中元素
- 支持網格背景
- 錯誤提示

### 實現細節
```typescript
// 高亮選中元素
function highlightSelectedElement(svg: string, id: string): string {
  return svg.replace(
    new RegExp(`id="${id}"(?!.*style=)`, "g"),
    `id="${id}" style="outline: 2px solid var(--primary)"`
  );
}
```

## CodeEditor
代碼編輯器組件，用於直接編輯SVG代碼。

### 功能
- 語法高亮
- 自動完成
- 錯誤提示
- 格式化

### 實現細節
```typescript
// SVG語法驗證
function validateSvgSyntax(code: string): string[] {
  const errors = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, "image/svg+xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      errors.push(parseError.textContent);
    }
  } catch (e) {
    errors.push(e.message);
  }
  return errors;
}
```

## 共享工具函數

### SVG解析
```typescript
export function parseSvgComponents(svgString: string): SVGComponent[] {
  // 解析SVG為DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");

  // 遞歸處理元素
  function processElement(element: Element): SVGComponent {
    return {
      id: element.id || generateUniqueId(),
      type: element.tagName.toLowerCase(),
      attributes: getElementAttributes(element),
      children: Array.from(element.children).map(processElement)
    };
  }

  return Array.from(doc.documentElement.children).map(processElement);
}
```

### 屬性處理
```typescript
export function updateSvgComponent(
  svgString: string,
  componentId: string,
  propertyName: string,
  propertyValue: string
): string {
  // 更新SVG元素屬性的邏輯
  // 包括特殊屬性處理（如style）
  // 返回更新後的SVG字符串
}
```

## 注意事項
1. 元件ID的生成和管理
2. SVG元素的查找和更新
3. 屬性值的驗證和轉換
4. 性能優化考慮