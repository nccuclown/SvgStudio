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

// 使用模塊作用域變數來確保正確重置
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
  // 重置計數器以確保一致性
  counter = 0;

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
    const existingId = element.getAttribute('id');
    const id = existingId || generateHierarchicalId(element, parentId);

    // 如果元素沒有ID，添加生成的ID
    if (!existingId) {
      element.setAttribute('id', id);
      console.log(`[preprocessSvg] 添加ID: ${id} 到 ${element.tagName}`);
    }

    // 處理子元素 - 使用當前元素的實際ID作為父ID
    const currentId = element.getAttribute('id') || id;
    Array.from(element.children).forEach(child => {
      processElement(child, currentId);
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
      if (!prop.trim()) return;
      const parts = prop.trim().split(':');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (name && value) {
          attributes[`style-${name}`] = value;
        }
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
  console.log(`[parseSvgComponents] 開始解析SVG`);

  // 前置處理：確保所有元素都有ID
  const processedSvg = preprocessSvg(svgString);
  console.log(`[parseSvgComponents] 前置處理完成，開始構建組件樹`);

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
    console.log(`[parseSvgComponents] 構建完成，根組件: ${rootComponent.id}, 子組件數: ${rootComponent.children.length}`);
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
 * 多層次查找策略：根據ID查找組件
 */
export function findComponentById(components: SVGComponent[], id: string): SVGComponent | null {
  console.log(`[findComponentById] 尋找組件: ${id}`);

  // 1. 直接通過ID查找
  for (const component of components) {
    if (component.id === id) {
      console.log(`[findComponentById] 直接找到組件: ${id}`);
      return component;
    }

    const result = findComponentById(component.children, id);
    if (result) return result;
  }

  // 2. 如果是階層ID，嘗試解析並部分匹配
  if (id.includes('-')) {
    console.log(`[findComponentById] 嘗試階層式查找: ${id}`);
    const parts = id.split('-');
    const rootId = parts[0];

    // 找到根元素
    for (const component of components) {
      if (component.id === rootId) {
        console.log(`[findComponentById] 找到父組件: ${rootId}`);
        // 嘗試在子組件中查找匹配的類型和索引
        if (parts.length > 2) {
          const childType = parts[1];
          const childIndex = parseInt(parts[2], 10);
          return findChildByTypeAndIndex(component, childType, childIndex);
        }
      }

      // 遞歸搜索
      const foundRoot = findComponentById(component.children, rootId);
      if (foundRoot) {
        if (parts.length > 2) {
          const childType = parts[1];
          const childIndex = parseInt(parts[2], 10);
          return findChildByTypeAndIndex(foundRoot, childType, childIndex);
        }
        return foundRoot;
      }
    }
  }

  console.log(`[findComponentById] 未找到組件: ${id}`);
  return null;
}

/**
 * 輔助函數：通過類型和索引查找子元素
 */
function findChildByTypeAndIndex(parent: SVGComponent, type: string, index: number): SVGComponent | null {
  console.log(`[findChildByTypeAndIndex] 在 ${parent.id} 下尋找類型 ${type}, 索引 ${index}`);

  let count = 0;
  for (const child of parent.children) {
    if (child.type.toLowerCase() === type.toLowerCase()) {
      if (count === index) {
        console.log(`[findChildByTypeAndIndex] 找到匹配元素: ${child.id}`);
        return child;
      }
      count++;
    }
  }

  console.log(`[findChildByTypeAndIndex] 未找到匹配元素，共有 ${count} 個 ${type} 類型元素`);
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

    // 增強的元素查找策略
    let element = null;

    // 1. 直接通過ID查找
    element = doc.getElementById(componentId);
    if (element) {
      console.log(`[updateSvgComponent] 直接找到元素: ${componentId}`);
    }

    // 2. 如果是階層ID，嘗試解析並查找
    if (!element && componentId.includes('-')) {
      console.log(`[updateSvgComponent] 嘗試階層式查找...`);
      const parts = componentId.split('-');

      // 如果格式是 "parent-type-index"
      if (parts.length >= 3) {
        const groupId = parts[0];
        const elementType = parts[1];
        const elementIndex = parseInt(parts[2], 10);

        console.log(`[updateSvgComponent] 分解ID: ${groupId} > ${elementType} > ${elementIndex}`);

        // 找到父組
        const groupElement = doc.getElementById(groupId);
        if (groupElement) {
          console.log(`[updateSvgComponent] 找到父組: ${groupId}`);

          // 找到指定類型的所有子元素
          const matchingElements = Array.from(groupElement.querySelectorAll(elementType));
          console.log(`[updateSvgComponent] 找到 ${matchingElements.length} 個 ${elementType} 元素`);

          // 檢查索引是否在範圍內
          if (elementIndex < matchingElements.length) {
            element = matchingElements[elementIndex];
            console.log(`[updateSvgComponent] 使用索引 ${elementIndex} 找到元素`);
          }
        }
      }
    }

    // 3. 嘗試使用XPath查找
    if (!element) {
      try {
        console.log(`[updateSvgComponent] 嘗試XPath查找...`);
        // 嘗試各種可能的XPath表達式
        const xpathExpressions = [
          `//*[@id="${componentId}"]`,
          `//g[@id="${componentId.split('-')[0]}"]/${componentId.split('-')[1]}[${parseInt(componentId.split('-')[2], 10) + 1}]`
        ];

        for (const xpath of xpathExpressions) {
          try {
            const result = document.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            element = result.singleNodeValue as Element;
            if (element) {
              console.log(`[updateSvgComponent] 使用XPath找到元素: ${xpath}`);
              break;
            }
          } catch (e) {
            console.log(`[updateSvgComponent] XPath表達式 ${xpath} 失敗`);
          }
        }
      } catch (e) {
        console.error(`[updateSvgComponent] XPath查找失敗:`, e);
      }
    }

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
          if (!pair.trim()) return;
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