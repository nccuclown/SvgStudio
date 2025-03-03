# SVG 元件修改流程與挑戰

## 當前修改邏輯

### 1. 元件識別流程
- 原始SVG包含多層嵌套的元素（g、circle、text等）
- 部分元素有原始ID（如 "stage3"），部分沒有ID
- 使用 generateUniqueId 為沒有ID的元素生成ID
- ID生成規則：`${parentId}-${type}-${counter}`

### 2. 屬性修改流程
- 使用者在元件樹中選擇元素
- PropertyPanel 組件觸發屬性變更
- updateComponentProperty 函數處理更新請求
- updateSvgComponent 在SVG中查找並修改元素

## 當前挑戰

### 1. 元素定位問題
- 原始SVG中大部分元素沒有ID
- 生成的ID與原始SVG結構不匹配
- 元素查找邏輯不能準確定位目標元素

### 2. 階層結構問題
- 原始SVG有明確的階層（如stage3及其子元素）
- 我們的ID生成邏輯破壞了這個階層關係
- 導致無法正確更新子元素的屬性

### 3. 元件樹顯示問題
- 需要更好的方式顯示元素的位置和屬性
- 當前顯示不夠直觀，難以識別具體元素
- 缺乏視覺提示來幫助定位元素

## 可能的解決方案

### 1. 使用XPath定位
```typescript
// 使用XPath定位元素，不依賴ID
const xpath = "/svg/g[@id='stage3']/circle[1]";
const element = document.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
```

### 2. 保持原始結構
```typescript
// 不生成新ID，使用父元素ID + 類型 + 索引
function getElementIdentifier(element: Element): string {
  const parent = element.parentElement;
  const parentId = parent?.getAttribute('id');
  const type = element.tagName.toLowerCase();
  const index = Array.from(parent?.children || [])
    .filter(el => el.tagName.toLowerCase() === type)
    .indexOf(element);
  return `${parentId || 'root'}/${type}[${index}]`;
}
```

### 3. 增強元件樹顯示
```typescript
function getElementPreview(element: Element): string {
  const attrs = element.attributes;
  const position = attrs.getNamedItem('x') || attrs.getNamedItem('cx');
  const size = attrs.getNamedItem('width') || attrs.getNamedItem('r');
  return `${element.tagName} (pos:${position?.value}, size:${size?.value})`;
}
```

## 下一步改進

1. 改用XPath來定位元素，避免ID依賴
2. 在元件樹中顯示更多元素信息（位置、尺寸、顏色等）
3. 在預覽中高亮顯示當前選中的元素
4. 添加即時預覽功能，實時顯示修改效果
