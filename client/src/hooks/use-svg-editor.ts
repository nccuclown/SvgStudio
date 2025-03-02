import { useState, useEffect, useCallback } from "react";
import { parseSvgComponents, flattenSvgComponents } from "@/lib/svg-utils";

const DEFAULT_SVG = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" />
  <circle id="circle1" cx="150" cy="50" r="40" fill="red" />
  <path id="path1" d="M10 150 L90 150 L50 90 Z" fill="green" />
</svg>`;

export function useSvgEditor() {
  const [code, setCode] = useState(DEFAULT_SVG);
  const [components, setComponents] = useState<Array<{ id: string; type: string; parentId?: string }>>([]);
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
        // Update the attribute
        element.setAttribute(property, value);

        // Convert back to string and update the code
        const serializer = new XMLSerializer();
        const updatedSvg = serializer.serializeToString(doc);

        // Find the original element in the code
        const elementRegex = new RegExp(`<[^>]*id="${id}"[^>]*>(?:.*?</${element.tagName}>)?`, 'gs');
        const match = code.match(elementRegex);

        if (match) {
          // Find the updated version of the element
          const updatedMatch = updatedSvg.match(elementRegex);
          if (updatedMatch) {
            // Replace only the specific element, preserving the rest of the code
            const newCode = code.replace(match[0], updatedMatch[0]);
            setCode(newCode);
            return;
          }
        }

        // Fallback: use the entire updated SVG if specific element replacement fails
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
    fullComponents,
  };
}