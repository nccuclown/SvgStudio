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

let counter = 0;

/**
 * 生成階層化的元素ID
 */
function generateHierarchicalId(element: Element, parentId?: string): string {
  const type = element.tagName.toLowerCase();
  const originalId = element.getAttribute('id');

  // 如果元素已有ID，直接返回
  if (originalId) {
    return originalId;
  }

  // 生成新ID
  if (parentId) {
    // 如果有父ID，使用父ID作為前綴（例如：stage3-circle-1）
    return `${parentId}-${type}-${counter++}`;
  } else {
    // 否則只使用類型和計數器（例如：circle-1）
    return `${type}-${counter++}`;
  }
}

/**
 * 前置處理：為SVG中沒有ID的元素添加階層化ID
 */
function preprocessSvg(svgString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");

  // 檢查解析錯誤
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error("SVG解析錯誤: " + errorNode.textContent);
  }

  // 遞歸處理元素
  function processElement(element: Element, parentId?: string) {
    // 獲取或生成ID
    const id = generateHierarchicalId(element, parentId);

    // 如果元素沒有ID，添加生成的ID
    if (!element.hasAttribute('id')) {
      element.setAttribute('id', id);
    }

    // 處理子元素
    Array.from(element.children).forEach(child => {
      processElement(child, id);
    });
  }

  // 處理根元素
  const svgElement = doc.querySelector('svg');
  if (svgElement) {
    processElement(svgElement);
  }

  // 序列化並返回處理後的SVG
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

/**
 * 獲取元素的所有屬性
 */
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

/**
 * 解析SVG為組件結構
 */
export function parseSvgComponents(svgString: string): SVGComponent[] {
  // 前置處理：確保所有元素都有ID
  const processedSvg = preprocessSvg(svgString);

  const parser = new DOMParser();
  const doc = parser.parseFromString(processedSvg, "image/svg+xml");
  const components: SVGComponent[] = [];

  // 檢查解析錯誤
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error("SVG解析錯誤: " + errorNode.textContent);
  }

  function processElement(element: Element, parentComponent?: SVGComponent): SVGComponent {
    const type = element.tagName.toLowerCase();
    const id = element.getAttribute('id') || '';

    // 創建組件對象
    const component: SVGComponent = {
      id,
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

    // 更新屬性
    try {
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
    } catch (attrError) {
      console.error(`[updateSvgComponent] 更新屬性時出錯:`, attrError);
      return svgString;
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