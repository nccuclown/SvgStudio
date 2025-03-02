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
      if (attr.name !== 'id') {
        attributes[attr.name] = attr.value;
      }
    });
    return attributes;
  }

  function processElement(element: Element, parentId?: string) {
    const type = element.tagName.toLowerCase();
    // Skip script and style tags
    if (type === 'script' || type === 'style') return;

    let id = element.id;
    // If element doesn't have an id, generate one
    if (!id) {
      id = `${type}-${counter++}`;
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

    // Process all child elements
    Array.from(element.children).forEach(child => {
      processElement(child, id);
    });

    return component;
  }

  const svgElement = doc.querySelector("svg");
  if (svgElement) {
    processElement(svgElement);
  }

  return components;
}

export function flattenSvgComponents(components: SVGComponent[]): Array<{ id: string; type: string }> {
  return components.map(component => ({
    id: component.id,
    type: component.type
  }));
}