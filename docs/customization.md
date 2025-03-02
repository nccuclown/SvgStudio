# 自定義指南

## 修改功能指南

### 1. 修改 SVG 解析邏輯
位置：`src/lib/svg-utils.ts`

```typescript
// 修改解析邏輯
function processElement(element: Element, parentId?: string) {
  // 自定義解析邏輯
}
```

### 2. 調整屬性面板
位置：`src/components/svg-editor/PropertyPanel.tsx`

```typescript
// 添加新的屬性類型
if (key === 'newAttribute') {
  // 自定義屬性編輯器
}
```

### 3. 更改預覽行為
位置：`src/components/svg-editor/Preview.tsx`

```typescript
// 修改選中元素的視覺效果
const modifiedSvg = svg.replace(
  new RegExp(`id="${selectedComponent}"(?!.*style=)`, "g"),
  `id="${selectedComponent}" style="自定義樣式"`
);
```

### 4. 擴展組件樹功能
位置：`src/components/svg-editor/ComponentTree.tsx`

```typescript
// 添加新的組件樹功能
function TreeNodeComponent({
  // 添加新的屬性
  newFeature,
}) {
  // 實現新功能
}
```

## 常見修改場景

### 1. 添加新的工具欄按鈕
位置：`src/components/svg-editor/SplitPane.tsx`

1. 添加按鈕圖標：
```typescript
import { NewIcon } from "lucide-react";
```

2. 添加按鈕處理函數：
```typescript
const handleNewAction = () => {
  // 實現新功能
};
```

3. 添加按鈕元素：
```typescript
<Button
  variant="outline"
  size="icon"
  onClick={handleNewAction}
  className="hover:bg-accent"
>
  <NewIcon className="h-4 w-4" />
</Button>
```

### 2. 修改屬性編輯行為
位置：`src/hooks/use-svg-editor.ts`

```typescript
const updateElementProperty = useCallback((id: string, property: string, value: string) => {
  // 自定義屬性更新邏輯
}, [code]);
```

### 3. 添加新的組件類型支持
1. 更新 SVG 解析器：
```typescript
// in svg-utils.ts
function processElement(element: Element) {
  if (element.tagName === 'newTag') {
    // 處理新的標籤類型
  }
}
```

2. 更新屬性面板：
```typescript
// in PropertyPanel.tsx
if (selectedProperties.type === 'newTag') {
  // 顯示特定的屬性編輯器
}
```

### 4. 自定義預覽行為
位置：`src/components/svg-editor/Preview.tsx`

```typescript
// 添加新的預覽功能
const customizePreview = (svg: string) => {
  // 實現自定義預覽邏輯
  return modifiedSvg;
};
```

## 樣式自定義

### 1. 修改主題
位置：`theme.json`

```json
{
  "variant": "professional",
  "primary": "自定義主色",
  "appearance": "dark",
  "radius": 0.5
}
```

### 2. 調整布局
位置：`src/pages/editor.tsx`

```typescript
<ResizablePanel defaultSize={自定義尺寸} minSize={自定義最小尺寸}>
  // 自定義布局
</ResizablePanel>
```

## 注意事項
1. 保持型別定義的一致性
2. 遵循 React 組件的生命週期
3. 確保 SVG 解析的準確性
4. 維護代碼格式和註釋
5. 進行充分的錯誤處理
