import { XMLParser } from 'fast-xml-parser';

interface SVGComponent {
  id: string;
  type: string;
  parentId?: string;
  attributes: Record<string, string>;
  children: SVGComponent[];
}

export function parseSvgComponents(svgString: string): Array<SVGComponent> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const components: Array<SVGComponent> = [];
  let counter = 0;

  function getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};
    Array.from(element.attributes).forEach(attr => {
      // Include all attributes including style
      attributes[attr.name] = attr.value;
    });

    // Parse style attribute if exists
    const style = element.getAttribute('style');
    if (style) {
      const styleObj = style.split(';').reduce((acc: Record<string, string>, curr: string) => {
        const [key, value] = curr.split(':').map(s => s.trim());
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      Object.assign(attributes, styleObj);
    }

    return attributes;
  }

  function processElement(element: Element, parentId?: string) {
    const type = element.tagName.toLowerCase();
    // Skip comments and processing instructions
    if (type === '#comment' || type === '#processing-instruction') return;

    let id = element.id;
    // If element doesn't have an id, generate one based on type and parent
    if (!id) {
      id = parentId ? 
        `${parentId}-${type}-${counter++}` : 
        `${type}-${counter++}`;
      element.id = id;
    }

    // Get all attributes of the element
    const attributes = getElementAttributes(element);

    // Create component object
    const component: SVGComponent = {
      id,
      type,
      parentId,
      attributes,
      children: []
    };

    components.push(component);

    // Process all child elements including animate and other special elements
    Array.from(element.children).forEach(child => {
      // Include animation elements
      if (child.tagName.toLowerCase().startsWith('animate')) {
        const animationComponent = processElement(child, id);
        if (animationComponent) {
          component.children.push(animationComponent);
        }
      } else {
        processElement(child, id);
      }
    });

    return component;
  }

  const svgElement = doc.querySelector("svg");
  if (svgElement) {
    processElement(svgElement);
  }

  return components;
}

export function flattenSvgComponents(components: SVGComponent[]): Array<{ id: string; type: string; parentId?: string }> {
  return components.map(component => ({
    id: component.id,
    type: component.type,
    parentId: component.parentId
  }));
}

/**
 * Updates a specific component's attribute in the SVG string
 */
export function updateSvgComponent(
  svgString: string,
  componentId: string,
  attributeName: string,
  attributeValue: string
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const element = doc.getElementById(componentId);

  if (!element) return svgString;

  // Handle style attributes differently
  if (element.style[attributeName as any]) {
    element.style[attributeName as any] = attributeValue;
  } else {
    element.setAttribute(attributeName, attributeValue);
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}