export function parseSvgComponents(svgString: string): Array<{ id: string; type: string }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const components: Array<{ id: string; type: string }> = [];

  function processElement(element: Element) {
    if (element.id) {
      components.push({
        id: element.id,
        type: element.tagName.toLowerCase(),
      });
    }

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
