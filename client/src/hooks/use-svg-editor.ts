import { useState, useEffect, useCallback, useRef } from "react";
import { 
  parseSvgComponents, 
  flattenSvgComponents, 
  findComponentById, 
  updateSvgComponent,
  SVGComponent,
  FlatComponent
} from "@/lib/svg-utils";
import { useToast } from "@/hooks/use-toast";

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
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const { toast } = useToast();

  const svgDomRef = useRef<Document | null>(null);

  // 選擇組件 - 支持多選
  const selectComponent = useCallback((id: string | null, isMultiSelect: boolean = false) => {
    if (!id) {
      setSelectedComponentIds([]);
      return;
    }

    setSelectedComponentIds(prev => {
      if (isMultiSelect) {
        return prev.includes(id) 
          ? prev.filter(existingId => existingId !== id)
          : [...prev, id];
      }
      return [id];
    });
  }, []);

  // 儲存當前文件
  const saveDocument = useCallback(async () => {
    if (!currentDocumentId) {
      toast({
        title: "錯誤",
        description: "請先選擇或建立一個檔案",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/svg/${currentDocumentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: processedSvgCode })
      });

      if (!response.ok) throw new Error('儲存失敗');

      toast({
        title: "成功",
        description: "檔案已儲存",
      });
    } catch (error) {
      toast({
        title: "錯誤",
        description: "儲存檔案失敗",
        variant: "destructive",
      });
    }
  }, [currentDocumentId, processedSvgCode, toast]);

  // 其他現有的功能保持不變...
  const hoverComponent = useCallback((id: string | null) => {
    setHoveredComponentId(id);
  }, []);

  const batchUpdateProperty = useCallback((property: string, operation: 'increase' | 'decrease', amount: number) => {
    if (selectedComponentIds.length === 0) return;

    try {
      let currentSvg = processedSvgCode;

      selectedComponentIds.forEach(id => {
        const component = findComponentById(fullComponents, id);
        if (!component) return;

        const currentValue = parseFloat(component.attributes[property] || '0');
        const newValue = operation === 'increase' 
          ? currentValue + amount 
          : Math.max(0, currentValue - amount);

        currentSvg = updateSvgComponent(currentSvg, id, property, newValue.toString());
      });

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

  const getCommonProperties = useCallback(() => {
    if (selectedComponentIds.length === 0) return null;

    const components = selectedComponentIds
      .map(id => findComponentById(fullComponents, id))
      .filter((component): component is SVGComponent => component !== null);

    if (components.length === 0) return null;

    const firstComponent = components[0];
    const commonProps: Record<string, string | null> = { ...firstComponent.attributes };

    components.slice(1).forEach(component => {
      Object.keys(commonProps).forEach(key => {
        if (component.attributes[key] !== commonProps[key]) {
          commonProps[key] = null; 
        }
      });
    });

    return commonProps;
  }, [selectedComponentIds, fullComponents]);

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
      setCopiedElement(elementsToCopy[0]); 
      console.log('已複製元素:', elementsToCopy[0]);
    }
  }, [selectedComponentIds, fullComponents]);

  const pasteComponent = useCallback(() => {
    if (!copiedElement) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedSvgCode, 'image/svg+xml');
      const svgRoot = doc.documentElement;

      const newElement = doc.createElementNS('http://www.w3.org/2000/svg', copiedElement.type);

      Object.entries(copiedElement.attributes).forEach(([key, value]) => {
        newElement.setAttribute(key, value);
      });

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

      svgRoot.appendChild(newElement);

      const serializer = new XMLSerializer();
      const updatedSvg = serializer.serializeToString(doc);
      setProcessedSvgCode(updatedSvg);

      const components = parseSvgComponents(updatedSvg);
      setFullComponents(components);
      setFlatComponents(flattenSvgComponents(components));

    } catch (error) {
      console.error('粘貼元素時出錯:', error);
    }
  }, [copiedElement, processedSvgCode]);

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

      const components = parseSvgComponents(updatedSvg);
      setFullComponents(components);
      setFlatComponents(flattenSvgComponents(components));

    } catch (error) {
      console.error('移動元素層級時出錯:', error);
    }
  }, [selectedComponentIds, processedSvgCode]);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

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
    hasCopiedElement: !!copiedElement,
    currentDocumentId,
    setCurrentDocumentId,
    saveDocument
  };
}