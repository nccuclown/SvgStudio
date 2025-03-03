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
  const [originalSvgCode, setOriginalSvgCode] = useState<string>(initialSvg);
  const [processedSvgCode, setProcessedSvgCode] = useState<string>('');
  const [flatComponents, setFlatComponents] = useState<FlatComponent[]>([]);
  const [fullComponents, setFullComponents] = useState<SVGComponent[]>([]);
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedElement, setCopiedElement] = useState<CopiedElement | null>(null);

  const svgDomRef = useRef<Document | null>(null);

  // 選擇組件 - 支持多選
  const selectComponent = useCallback((id: string | null, isMultiSelect: boolean = false) => {
    if (!id) {
      setSelectedComponentIds([]);
      return;
    }

    setSelectedComponentIds(prev => {
      if (isMultiSelect) {
        // 如果已選中則移除，否則添加
        return prev.includes(id) 
          ? prev.filter(existingId => existingId !== id)
          : [...prev, id];
      }
      // 單選模式
      return [id];
    });
  }, []);

  // 懸停組件
  const hoverComponent = useCallback((id: string | null) => {
    setHoveredComponentId(id);
  }, []);

  // 批量更新屬性
  const batchUpdateProperty = useCallback((property: string, operation: 'increase' | 'decrease', amount: number) => {
    if (selectedComponentIds.length === 0) return;

    try {
      let currentSvg = processedSvgCode;

      // 為每個選中的元素更新屬性
      selectedComponentIds.forEach(id => {
        const component = findComponentById(fullComponents, id);
        if (!component) return;

        const currentValue = parseFloat(component.attributes[property] || '0');
        const newValue = operation === 'increase' 
          ? currentValue + amount 
          : Math.max(0, currentValue - amount);

        currentSvg = updateSvgComponent(currentSvg, id, property, newValue.toString());
      });

      // 更新狀態
      if (currentSvg !== processedSvgCode) {
        setProcessedSvgCode(currentSvg);
        const components = parseSvgComponents(currentSvg);
        setFullComponents(components);
        setFlatComponents(flattenSvgComponents(components));
      }
    } catch (error) {
      console.error(`[batchUpdateProperty] 批量更新屬性時出錯:`, error);
    }
  }, [selectedComponentIds, processedSvgCode, fullComponents]);

  // 獲取選中元素的共同屬性
  const getCommonProperties = useCallback(() => {
    if (selectedComponentIds.length === 0) return null;

    const components = selectedComponentIds
      .map(id => findComponentById(fullComponents, id))
      .filter((component): component is SVGComponent => component !== null);

    if (components.length === 0) return null;

    // 獲取第一個組件的所有屬性
    const firstComponent = components[0];
    const commonProps: Record<string, string | null> = { ...firstComponent.attributes };

    // 與其他組件比較，保留共同的屬性
    components.slice(1).forEach(component => {
      Object.keys(commonProps).forEach(key => {
        if (component.attributes[key] !== commonProps[key]) {
          commonProps[key] = null; // 使用 null 表示該屬性值不一致
        }
      });
    });

    return commonProps;
  }, [selectedComponentIds, fullComponents]);

  // 複製選中的組件
  const copyComponent = useCallback(() => {
    if (selectedComponentIds.length === 0) return;

    const elementsToCopy: CopiedElement[] = selectedComponentIds
      .map(id => {
        const component = findComponentById(fullComponents, id);
        if (!component) return null;

        return {
          type: component.type,
          attributes: { ...component.attributes }
        };
      })
      .filter((el): el is CopiedElement => el !== null);

    if (elementsToCopy.length > 0) {
      setCopiedElement(elementsToCopy[0]); // 暫時只支持複製第一個元素
      console.log('已複製元素:', elementsToCopy[0]);
    }
  }, [selectedComponentIds, fullComponents]);

  // 其他方法保持不變...
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
    if (selectedComponentIds.length === 0) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedSvgCode, 'image/svg+xml');

      selectedComponentIds.forEach(id => {
        const selectedElement = doc.getElementById(id);
        if (!selectedElement || !selectedElement.parentNode) return;

        const parent = selectedElement.parentNode;

        if (direction === 'up' && selectedElement.nextElementSibling) {
          parent.insertBefore(selectedElement.nextElementSibling, selectedElement);
        } else if (direction === 'down' && selectedElement.previousElementSibling) {
          parent.insertBefore(selectedElement, selectedElement.previousElementSibling);
        }
      });

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
  }, [selectedComponentIds, processedSvgCode]);

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
    selectedComponentIds,
    selectComponent,
    hoveredComponentId,
    hoverComponent,
    showGrid,
    toggleGrid,
    validationError,
    updateComponentProperty,
    batchUpdateProperty,
    getCommonProperties,
    copyComponent,
    pasteComponent,
    moveComponentLayer,
    hasCopiedElement: !!copiedElement
  };
}