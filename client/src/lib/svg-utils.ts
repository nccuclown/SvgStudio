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

let uniqueIdCounter = 0;

function generateUniqueId(type: string): string {
  // 確保生成的ID不會與原始ID衝突
  return `generated-${type}-${uniqueIdCounter++}`;
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

  function processElement(element: Element, parentId?: string): SVGComponent {
    const type = element.tagName.toLowerCase();

    // 保留原始ID，只在沒有ID時生成新ID
    const id = element.getAttribute('id') || generateUniqueId(type);


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
        component.children.push(childComponent);
      }
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

    // 遞歸搜索子組件
    for (const child of component.children) {
      const result = findComponentById([child], id);
      if (result) return result;
    }
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
    console.log(`[updateSvgComponent] 解析 SVG 字符串...`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");

    // 檢查解析錯誤
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      console.error(`[updateSvgComponent] SVG 解析錯誤:`, parseError.textContent);
      return svgString;
    }

    console.log(`[updateSvgComponent] 查找目標元素: ${componentId}`);
    const element = doc.getElementById(componentId);

    if (!element) {
      console.warn(`[updateSvgComponent] 未找到元素 "${componentId}"`);
      return svgString;
    }

    console.log(`[updateSvgComponent] 找到元素:`, {
      tagName: element.tagName,
      currentAttributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }))
    });

    // 特殊屬性處理
    if (propertyName === '_text') {
      console.log(`[updateSvgComponent] 更新文本內容`);
      element.textContent = propertyValue;
    }
    // 樣式屬性處理
    else if (propertyName.startsWith('style-')) {
      console.log(`[updateSvgComponent] 更新樣式屬性`);
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

      console.log(`[updateSvgComponent] 新的樣式字符串:`, newStyle);
      element.setAttribute('style', newStyle);
    }
    // 一般屬性處理
    else {
      console.log(`[updateSvgComponent] 更新一般屬性`);
      if (propertyValue === '') {
        element.removeAttribute(propertyName);
      } else {
        element.setAttribute(propertyName, propertyValue);
      }
    }

    // 序列化並返回更新後的SVG
    console.log(`[updateSvgComponent] 序列化更新後的文檔`);
    const serializer = new XMLSerializer();
    const updatedSvg = serializer.serializeToString(doc);

    // 驗證更新是否成功
    console.log(`[updateSvgComponent] 驗證更新後的 SVG`);
    const validation = new DOMParser().parseFromString(updatedSvg, "image/svg+xml");
    if (validation.querySelector("parsererror")) {
      console.error(`[updateSvgComponent] 更新後的 SVG 無效`);
      return svgString;
    }

    console.log(`[updateSvgComponent] 更新成功`);
    return updatedSvg;
  } catch (error) {
    console.error(`[updateSvgComponent] 處理過程中出錯:`, error);
    return svgString;
  }
}