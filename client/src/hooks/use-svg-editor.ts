import { useState, useEffect, useCallback, useRef } from "react";
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

interface CopiedElement {
  type: string;
  attributes: Record<string, string>;
}

/**
 * SVG 編輯器自定義 Hook
 */
export function useSvgEditor(initialSvg = DEFAULT_SVG) {
  // 原始SVG代碼
  const [originalSvgCode, setOriginalSvgCode] = useState<string>(initialSvg);
  const [processedSvgCode, setProcessedSvgCode] = useState<string>('');
  const [flatComponents, setFlatComponents] = useState<FlatComponent[]>([]);
  const [fullComponents, setFullComponents] = useState<SVGComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedElement, setCopiedElement] = useState<CopiedElement | null>(null);

  const svgDomRef = useRef<Document | null>(null);

  // 選擇組件
  const selectComponent = useCallback((id: string | null) => {
    console.log(`[selectComponent] 選中組件: ${id}`);
    setSelectedComponentId(id);
  }, []);

  // 懸停組件
  const hoverComponent = useCallback((id: string | null) => {
    setHoveredComponentId(id);
  }, []);

  // 複製組件
  const copyComponent = useCallback(() => {
    if (!selectedComponentId) return;

    const component = findComponentById(fullComponents, selectedComponentId);
    if (!component) return;

    const elementToCopy: CopiedElement = {
      type: component.type,
      attributes: { ...component.attributes }
    };

    // 移除ID屬性，因為粘貼時需要生成新的ID
    delete elementToCopy.attributes.id;

    setCopiedElement(elementToCopy);
    console.log('已複製元素:', elementToCopy);
  }, [selectedComponentId, fullComponents]);

  // 粘貼組件
  const pasteComponent = useCallback(() => {
    if (!copiedElement) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedSvgCode, 'image/svg+xml');
      const svgRoot = doc.documentElement;

      // 創建新元素
      const newElement = doc.createElementNS('http://www.w3.org/2000/svg', copiedElement.type);

      // 設置屬性
      Object.entries(copiedElement.attributes).forEach(([key, value]) => {
        newElement.setAttribute(key, value);
      });

      // 稍微偏移位置，避免完全重疊
      if (copiedElement.attributes.x) {
        newElement.setAttribute('x', String(parseFloat(copiedElement.attributes.x) + 20));
      }
      if (copiedElement.attributes.y) {
        newElement.setAttribute('y', String(parseFloat(copiedElement.attributes.y) + 20));
      }
      if (copiedElement.attributes.cx) {
        newElement.setAttribute('cx', String(parseFloat(copiedElement.attributes.cx) + 20));
      }
      if (copiedElement.attributes.cy) {
        newElement.setAttribute('cy', String(parseFloat(copiedElement.attributes.cy) + 20));
      }

      // 添加到SVG中
      svgRoot.appendChild(newElement);

      // 更新代碼
      const serializer = new XMLSerializer();
      const updatedSvg = serializer.serializeToString(doc);
      setProcessedSvgCode(updatedSvg);

      // 重新解析組件
      const components = parseSvgComponents(updatedSvg);
      setFullComponents(components);
      setFlatComponents(flattenSvgComponents(components));

    } catch (error) {
      console.error('粘貼元素時出錯:', error);
    }
  }, [copiedElement, processedSvgCode]);

  // 更新組件層級
  const moveComponentLayer = useCallback((direction: 'up' | 'down') => {
    if (!selectedComponentId) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedSvgCode, 'image/svg+xml');
      const selectedElement = doc.getElementById(selectedComponentId);

      if (!selectedElement || !selectedElement.parentNode) return;

      const parent = selectedElement.parentNode;

      if (direction === 'up' && selectedElement.nextElementSibling) {
        parent.insertBefore(selectedElement.nextElementSibling, selectedElement);
      } else if (direction === 'down' && selectedElement.previousElementSibling) {
        parent.insertBefore(selectedElement, selectedElement.previousElementSibling);
      }

      const serializer = new XMLSerializer();
      const updatedSvg = serializer.serializeToString(doc);
      setProcessedSvgCode(updatedSvg);

      // 重新解析組件
      const components = parseSvgComponents(updatedSvg);
      setFullComponents(components);
      setFlatComponents(flattenSvgComponents(components));

    } catch (error) {
      console.error('移動元素層級時出錯:', error);
    }
  }, [selectedComponentId, processedSvgCode]);

  // 切換網格顯示
  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  // 更新組件屬性
  const updateComponentProperty = useCallback((id: string, property: string, value: string) => {
    try {
      const updatedSvg = updateSvgComponent(processedSvgCode, id, property, value);
      if (updatedSvg !== processedSvgCode) {
        setProcessedSvgCode(updatedSvg);
        const components = parseSvgComponents(updatedSvg);
        setFullComponents(components);
        setFlatComponents(flattenSvgComponents(components));
      }
    } catch (error) {
      console.error(`[updateComponentProperty] 更新過程中出錯:`, error);
    }
  }, [processedSvgCode]);

  // 解析 SVG 代碼
  useEffect(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalSvgCode, "image/svg+xml");
      const errorNode = doc.querySelector("parsererror");

      if (errorNode) {
        setValidationError("SVG 語法無效");
        return;
      }

      setValidationError(null);
      svgDomRef.current = doc;

      const components = parseSvgComponents(originalSvgCode);
      const processedDoc = parser.parseFromString(originalSvgCode, "image/svg+xml");
      const serializer = new XMLSerializer();
      const processed = serializer.serializeToString(processedDoc);
      setProcessedSvgCode(processed);

      const processedComponents = parseSvgComponents(processed);
      setFullComponents(processedComponents);
      setFlatComponents(flattenSvgComponents(processedComponents));

    } catch (error) {
      console.error("解析 SVG 時出錯:", error);
      setValidationError((error as Error).message);
    }
  }, [originalSvgCode]);

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
    updateComponentProperty,
    copyComponent,
    pasteComponent,
    moveComponentLayer,
    hasCopiedElement: !!copiedElement
  };
}