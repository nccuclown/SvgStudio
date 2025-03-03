import { useState, useEffect, useCallback } from "react";
import { 
  parseSvgComponents, 
  flattenSvgComponents, 
  findComponentById, 
  updateSvgComponent,
  SVGComponent,
  FlatComponent
} from "@/lib/svg-utils";

// 默認 SVG 範例
const DEFAULT_SVG = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue" />
  <circle cx="150" cy="50" r="40" fill="red" />
  <path d="M10 150 L90 150 L50 90 Z" fill="green" />
</svg>`;

/**
 * SVG 編輯器自定義 Hook
 */
export function useSvgEditor(initialSvg = DEFAULT_SVG) {
  // 原始SVG代碼
  const [originalSvgCode, setOriginalSvgCode] = useState<string>(initialSvg);

  // 處理後的SVG代碼（帶有ID）
  const [processedSvgCode, setProcessedSvgCode] = useState<string>('');

  // 組件結構
  const [flatComponents, setFlatComponents] = useState<FlatComponent[]>([]);
  const [fullComponents, setFullComponents] = useState<SVGComponent[]>([]);

  // 選擇和懸停狀態
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  // 其他狀態
  const [showGrid, setShowGrid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 解析 SVG 代碼
  useEffect(() => {
    try {
      // 驗證原始 SVG 語法
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalSvgCode, "image/svg+xml");
      const errorNode = doc.querySelector("parsererror");

      if (errorNode) {
        setValidationError("SVG 語法無效");
        return;
      }

      // 清除驗證錯誤
      setValidationError(null);

      // 解析 SVG 組件（這個過程會生成帶有ID的新SVG）
      const components = parseSvgComponents(originalSvgCode);
      setFullComponents(components);

      // 扁平化組件結構
      const flattened = flattenSvgComponents(components);
      setFlatComponents(flattened);

      // 獲取處理後的SVG代碼
      const processedDoc = parser.parseFromString(originalSvgCode, "image/svg+xml");
      const serializer = new XMLSerializer();
      setProcessedSvgCode(serializer.serializeToString(processedDoc));

    } catch (error) {
      console.error("解析 SVG 時出錯:", error);
      setValidationError((error as Error).message);
    }
  }, [originalSvgCode]);

  // 更新組件屬性
  const updateComponentProperty = useCallback((id: string, property: string, value: string) => {
    console.log(`[updateComponentProperty] 開始更新組件屬性:`, {
      id,
      property,
      value
    });

    try {
      const updatedSvg = updateSvgComponent(processedSvgCode, id, property, value);

      if (updatedSvg !== processedSvgCode) {
        setProcessedSvgCode(updatedSvg);

        // 重新解析組件結構
        const components = parseSvgComponents(updatedSvg);
        setFullComponents(components);
        setFlatComponents(flattenSvgComponents(components));
      }
    } catch (error) {
      console.error(`[updateComponentProperty] 更新過程中出錯:`, error);
    }
  }, [processedSvgCode]);

  // 切換網格顯示
  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  // 更新選中組件
  const selectComponent = useCallback((id: string | null) => {
    setSelectedComponentId(id);
  }, []);

  // 更新懸停組件
  const hoverComponent = useCallback((id: string | null) => {
    setHoveredComponentId(id);
  }, []);

  return {
    originalSvgCode,
    setOriginalSvgCode,
    processedSvgCode,
    components: flatComponents,
    fullComponents,
    selectedComponentId,
    selectComponent,
    hoveredComponentId,
    hoverComponent,
    showGrid,
    toggleGrid,
    validationError,
    updateComponentProperty
  };
}