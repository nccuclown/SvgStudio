# SVG Editor 技術文件

## 專案概述
這是一個專業的 SVG 編輯平台，提供進階的組件操作和智能解析功能。使用者可以通過直觀的界面編輯 SVG 程式碼，並即時預覽效果。

## 主要功能
- 分割視圖界面，支持程式碼和視覺編輯
- 層級結構的組件樹導航
- 智能 SVG 解析，支持完整的元素屬性
- 互動式屬性面板，用於直接編輯屬性
- 即時 SVG 預覽，具有增強的選擇高亮功能
- 響應式設計，提供流暢的編輯體驗

## 技術棧
- React.js 前端框架
- TypeScript 強型別支持
- 自定義 SVG 渲染和解析鉤子
- Tailwind CSS 樣式框架
- shadcn/ui 組件庫

## 快速入門
1. 安裝依賴：
```bash
npm install
```

2. 啟動開發服務器：
```bash
npm run dev
```

3. 打開瀏覽器訪問：
```
http://localhost:5000
```

## 相關文檔
- [架構文檔](./architecture.md)
- [組件文檔](./components.md)
- [自定義指南](./customization.md)

## 注意事項
- 本項目使用 Replit 進行開發和部署
- 所有組件都遵循 TypeScript 強型別規範
- 使用 shadcn/ui 組件進行界面開發
