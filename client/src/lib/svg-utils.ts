/**
 * SVG編輯器工具函數
 */

export interface SVGComponent {
  id: string;          // 元素的ID
  type: string;        // 元素類型
  parentId?: string;   // 父元素ID
  attributes: Record<string, string>; // 元素的所有屬性
  children: SVGComponent[];
}

export interface FlatComponent {
  id: string;
  type: string;
  parentId?: string;
  attributes: Record<string, string>;
}

/**
 * 解析SVG字符串為組件樹
 */
export function parseSvgComponents(svgString: string): SVGComponent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const components: SVGComponent[] = [];

  // 檢查解析錯誤
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error("SVG解析錯誤: " + errorNode.textContent);
  }

  function getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};

    // 獲取所有屬性
    Array.from(element.attributes).forEach(attr => {
      attributes[attr.name] = attr.value;
    });

    // 解析樣式屬性
    const style = element.getAttribute('style');
    if (style) {
      style.split(';').forEach(prop => {
        const [name, value] = prop.trim().split(':').map(s => s.trim());
        if (name && value) {
          attributes[`style-${name}`] = value;
        }
      });
    }

    // 處理文本內容
    const textContent = element.textContent?.trim();
    if (textContent && element.children.length === 0) {
      attributes['_text'] = textContent;
    }

    return attributes;
  }

  function processElement(element: Element, parentComponent?: SVGComponent): SVGComponent {
    const type = element.tagName.toLowerCase();

    // 創建組件對象，使用原始ID
    const component: SVGComponent = {
      id: element.getAttribute('id') || '', // 保持原始ID
      type,
      parentId: parentComponent?.id,
      attributes: getElementAttributes(element),
      children: []
    };

    // 處理子元素
    Array.from(element.children).forEach(child => {
      const childComponent = processElement(child, component);
      component.children.push(childComponent);
    });

    return component;
  }

  // 從根元素開始處理
  const svgElement = doc.querySelector('svg');
  if (svgElement) {
    const rootComponent = processElement(svgElement);
    components.push(rootComponent);
  }

  return components;
}

/**
 * 將組件樹扁平化為列表
 */
export function flattenSvgComponents(components: SVGComponent[]): FlatComponent[] {
  const result: FlatComponent[] = [];

  function flatten(component: SVGComponent) {
    result.push({
      id: component.id,
      type: component.type,
      parentId: component.parentId,
      attributes: component.attributes
    });

    component.children.forEach(child => flatten(child));
  }

  components.forEach(component => flatten(component));
  return result;
}

/**
 * 在組件樹中查找特定ID的組件
 */
export function findComponentById(components: SVGComponent[], id: string): SVGComponent | null {
  for (const component of components) {
    if (component.id === id) {
      return component;
    }

    const result = findComponentById(component.children, id);
    if (result) return result;
  }

  return null;
}

/**
 * 更新SVG組件的屬性
 */
export function updateSvgComponent(
  svgString: string,
  componentId: string,
  propertyName: string,
  propertyValue: string
): string {
  console.log(`[updateSvgComponent] 開始更新組件屬性:`, {
    componentId,
    propertyName,
    propertyValue
  });

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");

    // 遞歸查找元素
    function findElementById(element: Element, id: string): Element | null {
      if (element.getAttribute('id') === id) {
        return element;
      }

      for (const child of Array.from(element.children)) {
        const found = findElementById(child, id);
        if (found) return found;
      }

      return null;
    }

    // 從根元素開始查找
    const svgRoot = doc.documentElement;
    const element = findElementById(svgRoot, componentId);

    if (!element) {
      console.warn(`[updateSvgComponent] 未找到元素 "${componentId}"`);
      return svgString;
    }

    console.log(`[updateSvgComponent] 找到元素:`, {
      type: element.tagName,
      currentId: element.getAttribute('id'),
      parentId: element.parentElement?.getAttribute('id')
    });

    // 更新屬性
    if (propertyName === '_text') {
      element.textContent = propertyValue;
    } else if (propertyName.startsWith('style-')) {
      const styleName = propertyName.replace('style-', '');
      const currentStyle = element.getAttribute('style') || '';

      // 解析當前樣式
      const styles = new Map();
      currentStyle.split(';').forEach(pair => {
        const [name, value] = pair.split(':').map(s => s.trim());
        if (name && value) {
          styles.set(name, value);
        }
      });

      // 更新或添加新樣式
      styles.set(styleName, propertyValue);

      // 重建樣式字符串
      const newStyle = Array.from(styles.entries())
        .map(([name, value]) => `${name}: ${value}`)
        .join('; ');

      element.setAttribute('style', newStyle);
    } else {
      if (propertyValue === '') {
        element.removeAttribute(propertyName);
      } else {
        element.setAttribute(propertyName, propertyValue);
      }
    }

    // 序列化並返回
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (error) {
    console.error("更新SVG元素屬性時出錯:", error);
    return svgString;
  }
}