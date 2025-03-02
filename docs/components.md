# 組件文檔

## CodeEditor
程式碼編輯器組件，基於 CodeMirror 實現。

### 功能
- SVG 語法高亮
- 錯誤提示
- 自動跳轉到選中元素
- 實時驗證

### 主要屬性
```typescript
interface CodeEditorProps {
  value: string;              // SVG 程式碼
  onChange: (value: string) => void;  // 程式碼更改處理函數
  error: string | null;       // 錯誤信息
  selectedComponent: string | null;    // 選中的組件 ID
}
```

## ComponentTree
組件樹導航組件，顯示 SVG 元素的層級結構。

### 功能
- 層級展示 SVG 組件
- 支持展開/收起
- 懸停高亮
- 選中狀態管理

### 主要屬性
```typescript
interface ComponentTreeProps {
  components: Array<{ id: string; type: string; parentId?: string }>;
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  onHoverComponent: (id: string | null) => void;
}
```

## Preview
SVG 預覽組件，提供即時預覽和互動功能。

### 功能
- SVG 即時渲染
- 選中元素高亮
- 懸停元素提示
- 網格背景切換
- 全屏預覽

### 主要屬性
```typescript
interface PreviewProps {
  svg: string;
  showGrid: boolean;
  selectedComponent: string | null;
  hoveredComponent: string | null;
  isFullscreen: boolean;
}
```

## PropertyPanel
屬性面板組件，用於編輯 SVG 元素屬性。

### 功能
- 顯示選中元素屬性
- 支持屬性編輯
- 顏色選擇器
- 即時更新

### 主要屬性
```typescript
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
```

## SplitPane
分割視圖組件，管理編輯器布局。

### 功能
- 可調整分割比例
- 工具欄管理
- 全屏切換
- 代碼複製

### 主要屬性
```typescript
interface SplitPaneProps {
  code: string;
  onCodeChange: (code: string) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  selectedComponent: string | null;
  hoveredComponent: string | null;
  validationError: string | null;
}
```
