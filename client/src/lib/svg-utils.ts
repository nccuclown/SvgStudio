/**
 * SVG編輯器工具函數
 * 提供SVG解析、操作和序列化功能
 */

export interface SVGComponent {
  id: string;
  type: string;
  parentId?: string;
  attributes: Record<string, string>;
  children: SVGComponent[];
}

export interface FlatComponent {
  id: string;
  type: string;
  parentId?: string;
}

/**
 * 解析SVG字符串為組件樹
 */
export function parseSvgComponents(svgString: string): SVGComponent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const components: SVGComponent[] = [];
  let counter = 0;

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

  function processElement(element: Element, parentId?: string): SVGComponent | null {
    const type = element.tagName.toLowerCase();

    // 跳過註釋和處理指令
    if (type === '#comment' || type === '#processing-instruction') {
      return null;
    }

    // 獲取或生成元素ID
    let id = element.getAttribute('id') || '';
    if (!id) {
      id = parentId ? 
        `${parentId}-${type}-${counter++}` : 
        `${type}-${counter++}`;
      element.setAttribute('id', id);
    }

    // 創建組件對象
    const component: SVGComponent = {
      id,
      type,
      parentId,
      attributes: getElementAttributes(element),
      children: []
    };

    // 處理子元素
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as Element;
        const childComponent = processElement(childElement, id);
        if (childComponent) {
          component.children.push(childComponent);
        }
      }
    });

    return component;
  }

  // 從根元素開始處理
  const svgElement = doc.querySelector('svg');
  if (svgElement) {
    const rootComponent = processElement(svgElement);
    if (rootComponent) {
      components.push(rootComponent);
    }
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
      parentId: component.parentId
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

    const found = component.children.find(child => child.id === id);
    if (found) return found;

    // 遞歸搜索子組件
    for (const child of component.children) {
      const result = findComponentById([child], id);
      if (result) return result;
    }
  }

  return null;
}

/**
 * 更新SVG元素的屬性
 */
export function updateSvgComponent(
  svgString: string,
  componentId: string,
  propertyName: string,
  propertyValue: string
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const element = doc.getElementById(componentId);

    if (!element) return svgString;

    // 檢查是否為樣式屬性
    if (propertyName.startsWith('style-')) {
      const styleName = propertyName.replace('style-', '');
      const currentStyles = element.getAttribute('style') || '';
      const styles = new Map(
        currentStyles.split(';')
          .map(s => s.trim())
          .filter(s => s)
          .map(s => s.split(':').map(p => p.trim()) as [string, string])
      );

      styles.set(styleName, propertyValue);
      const newStyle = Array.from(styles.entries())
        .map(([name, value]) => `${name}: ${value}`)
        .join('; ');

      element.setAttribute('style', newStyle);
    } else if (propertyName === '_text') {
      // 處理文本內容
      element.textContent = propertyValue;
    } else {
      // 處理普通屬性
      element.setAttribute(propertyName, propertyValue);
    }

    // 序列化並返回更新後的SVG
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (error) {
    console.error('更新SVG元素屬性時出錯:', error);
    return svgString;
  }
}
