export function parseSvgComponents(svgString: string): Array<{ id: string; type: string }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const components: Array<{ id: string; type: string }> = [];
  let counter = 0;

  function processElement(element: Element) {
    const type = element.tagName.toLowerCase();
    // Skip script and style tags
    if (type === 'script' || type === 'style') return;

    let id = element.id;
    // If element doesn't have an id, generate one
    if (!id) {
      id = `${type}-${counter++}`;
      element.id = id;
    }

    components.push({ id, type });

    // Process all child elements
    for (const child of Array.from(element.children)) {
      processElement(child);
    }
  }

  const svgElement = doc.querySelector("svg");
  if (svgElement) {
    processElement(svgElement);
  }

  return components;
}