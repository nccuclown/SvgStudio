import { useState, useEffect, useCallback } from "react";
import { parseSvgComponents, flattenSvgComponents } from "@/lib/svg-utils";

const DEFAULT_SVG = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" />
  <circle id="circle1" cx="150" cy="50" r="40" fill="red" />
  <path id="path1" d="M10 150 L90 150 L50 90 Z" fill="green" />
</svg>`;

export function useSvgEditor() {
  const [code, setCode] = useState(DEFAULT_SVG);
  const [components, setComponents] = useState<Array<{ id: string; type: string }>>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fullComponents, setFullComponents] = useState<ReturnType<typeof parseSvgComponents>>([]);

  useEffect(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "image/svg+xml");
      const errorNode = doc.querySelector("parsererror");

      if (errorNode) {
        setValidationError("Invalid SVG syntax");
        return;
      }

      setValidationError(null);
      const parsed = parseSvgComponents(code);
      setFullComponents(parsed);
      setComponents(flattenSvgComponents(parsed));
    } catch (err) {
      setValidationError((err as Error).message);
    }
  }, [code]);

  const updateElementProperty = useCallback((id: string, property: string, value: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "image/svg+xml");
      const element = doc.getElementById(id);

      if (element) {
        element.setAttribute(property, value);
        const serializer = new XMLSerializer();
        const updatedSvg = serializer.serializeToString(doc);
        setCode(updatedSvg);
      }
    } catch (err) {
      console.error("Failed to update property:", err);
    }
  }, [code]);

  const toggleGrid = () => setShowGrid(!showGrid);

  return {
    code,
    setCode,
    components,
    selectedComponent,
    setSelectedComponent,
    hoveredComponent,
    setHoveredComponent,
    showGrid,
    toggleGrid,
    validationError,
    updateElementProperty,
    fullComponents, // Add this to expose full component data
  };
}