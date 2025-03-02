/**
 * SVG編輯器工具函數
 */

export interface SVGComponent {
  id: string;          // 元素的實際ID（如果有）或路徑索引
  type: string;        // 元素類型
  parentId?: string;   // 父元素ID或路徑
  path: number[];      // DOM中的路徑索引
  attributes: Record<string, string>;
  children: SVGComponent[];
}

export interface FlatComponent {
  id: string;
  type: string;
  parentId?: string;
  path: number[];      // 保留路徑信息
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

  function processElement(element: Element, parentPath: number[] = []): SVGComponent {
    const type = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentElement?.children || []);
    const index = siblings.indexOf(element);
    const path = [...parentPath, index];

    // 創建組件對象，使用原始ID或路徑作為標識符
    const component: SVGComponent = {
      id: element.getAttribute('id') || `path-${path.join('-')}`,
      type,
      path,
      parentId: parentPath.length ? `path-${parentPath.join('-')}` : undefined,
      attributes: getElementAttributes(element),
      children: []
    };

    // 處理子元素
    Array.from(element.children).forEach((child, childIndex) => {
      const childComponent = processElement(child, path);
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
      path: component.path
    });

    component.children.forEach(child => flatten(child));
  }

  components.forEach(component => flatten(component));
  return result;
}

/**
 * 使用路徑查找元素
 */
function findElementByPath(doc: Document, path: number[]): Element | null {
  let current: Element | null = doc.documentElement;

  for (const index of path) {
    if (!current || !current.children[index]) {
      return null;
    }
    current = current.children[index];
  }

  return current;
}

/**
 * 在組件樹中查找特定元素
 */
export function findComponentById(components: SVGComponent[], id: string): SVGComponent | null {
  for (const component of components) {
    if (component.id === id || `path-${component.path.join('-')}` === id) {
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
  console.log(`[updateSvgComponent] 開始更新元素:`, { componentId, propertyName, propertyValue });

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");

    // 先嘗試通過ID查找
    let element = doc.getElementById(componentId);

    // 如果沒有找到，嘗試通過路徑查找
    if (!element && componentId.startsWith('path-')) {
      const path = componentId.replace('path-', '').split('-').map(Number);
      element = findElementByPath(doc, path);
    }

    if (!element) {
      console.warn(`[updateSvgComponent] 未找到元素:`, componentId);
      return svgString;
    }

    // 更新屬性
    if (propertyName === '_text') {
      element.textContent = propertyValue;
    } else if (propertyName.startsWith('style-')) {
      const styleName = propertyName.replace('style-', '');
      const currentStyle = element.getAttribute('style') || '';
      const styles = new Map();

      currentStyle.split(';').forEach(pair => {
        const [name, value] = pair.split(':').map(s => s.trim());
        if (name && value) {
          styles.set(name, value);
        }
      });

      styles.set(styleName, propertyValue);
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
    console.error(`[updateSvgComponent] 錯誤:`, error);
    return svgString;
  }
}

let uniqueIdCounter = 0;

function generateUniqueId(type: string): string {
  // 確保生成的ID不會與原始ID衝突
  return `generated-${type}-${uniqueIdCounter++}`;
}