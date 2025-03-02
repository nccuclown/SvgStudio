import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FlatComponent } from "@/lib/svg-utils";

// 樹節點結構
interface TreeNode {
  id: string;
  type: string;
  parentId?: string;
  children: TreeNode[];
  isHidden?: boolean;
}

interface ComponentTreeProps {
  components: FlatComponent[];
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  onHoverComponent: (id: string | null) => void;
}

export function ComponentTree({
  components,
  selectedComponent,
  onSelectComponent,
  onHoverComponent,
}: ComponentTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // 構建樹結構
  const treeData = useMemo(() => {
    // 確保我們有組件可處理
    if (!components.length) return [];

    // 創建節點映射
    const nodeMap = new Map<string, TreeNode>();

    // 初始化所有節點
    components.forEach(comp => {
      nodeMap.set(comp.id, {
        id: comp.id,
        type: comp.type,
        parentId: comp.parentId,
        children: []
      });
    });

    // 構建樹結構
    const roots: TreeNode[] = [];

    // 將子節點添加到父節點
    components.forEach(comp => {
      const node = nodeMap.get(comp.id);

      if (!node) return; // 跳過未找到的節點

      if (comp.parentId && nodeMap.has(comp.parentId)) {
        // 添加到父節點的子節點列表
        const parent = nodeMap.get(comp.parentId);
        if (parent && !parent.children.some(child => child.id === node.id)) {
          parent.children.push(node);
        }
      } else {
        // 如果沒有父節點或父節點未找到，添加為根節點
        if (!roots.some(root => root.id === node.id)) {
          roots.push(node);
        }
      }
    });

    // 排序邏輯
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        // 優先顯示 SVG 元素
        if (a.type === 'svg' && b.type !== 'svg') return -1;
        if (a.type !== 'svg' && b.type === 'svg') return 1;

        // 按類型排序
        if (a.type !== b.type) return a.type.localeCompare(b.type);

        // 同類型按 ID 排序
        return a.id.localeCompare(b.id);
      });

      // 遞歸排序子節點
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    // 排序根節點
    sortNodes(roots);

    return roots;
  }, [components]);

  // 過濾樹，高亮匹配搜索的節點
  const filteredTreeData = useMemo(() => {
    if (!searchTerm.trim()) return treeData;

    // 深拷貝樹
    const cloneTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => ({
        ...node,
        children: cloneTree(node.children)
      }));
    };

    const cloned = cloneTree(treeData);

    // 過濾函數
    const filterNode = (node: TreeNode): boolean => {
      // 檢查是否匹配搜索詞
      const matchesSearch = 
        node.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        node.type.toLowerCase().includes(searchTerm.toLowerCase());

      // 處理子節點
      const childrenVisible = node.children.length > 0 && 
        node.children.some(child => filterNode(child));

      // 如果自己匹配或子節點匹配，則顯示
      node.isHidden = !(matchesSearch || childrenVisible);

      return !node.isHidden;
    };

    // 應用過濾
    cloned.forEach(node => filterNode(node));

    return cloned;
  }, [treeData, searchTerm]);

  // 節點組件
  function TreeNode({
    node,
    level = 0
  }: {
    node: TreeNode;
    level?: number;
  }) {
    const [isExpanded, setIsExpanded] = useState(level === 0 || node.type === "svg");
    const hasChildren = node.children.length > 0;

    // 如果節點被隱藏，則不渲染
    if (node.isHidden) return null;

    // 是否匹配搜索
    const isMatch = searchTerm && (
      node.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      node.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 是否為當前選中的節點
    const isSelected = selectedComponent === node.id;

    // 節點縮進
    const indent = level * 12;

    return (
      <div>
        <div 
          className={cn(
            "flex items-center py-1 px-1 rounded-sm",
            isMatch && "bg-accent/20",
            isSelected && "bg-accent/40"
          )}
          style={{ paddingLeft: `${indent}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <div
            className="flex-1 flex items-center cursor-pointer text-sm pl-1 py-0.5"
            onMouseEnter={() => onHoverComponent(node.id)}
            onMouseLeave={() => onHoverComponent(null)}
            onClick={() => onSelectComponent(node.id)}
          >
            <span className={cn(
              "font-medium mr-1",
              isMatch && "text-primary"
            )}>
              {node.type}
            </span>
            <span className="text-muted-foreground text-xs truncate">
              ({node.id})
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => (
              <TreeNode 
                key={`tree-node-${child.id}`} 
                node={child} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="relative mb-4 px-4">
        <Search className="absolute left-6 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋元件..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium mb-2">元件結構樹</h3>

          {filteredTreeData.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              沒有可用元件或沒有匹配的搜尋結果
            </div>
          ) : (
            filteredTreeData.map(node => (
              <TreeNode 
                key={`tree-root-${node.id}`} 
                node={node} 
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}