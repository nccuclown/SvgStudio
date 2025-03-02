import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FlatComponent } from "@/lib/svg-utils";

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

// 建立樹狀結構
function buildTree(components: FlatComponent[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // 創建所有節點
  components.forEach(comp => {
    nodeMap.set(comp.id, {
      id: comp.id,
      type: comp.type,
      parentId: comp.parentId,
      children: []
    });
  });

  // 建立樹狀結構
  components.forEach(comp => {
    const node = nodeMap.get(comp.id);
    if (!node) return;

    if (comp.parentId && nodeMap.has(comp.parentId)) {
      const parent = nodeMap.get(comp.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 排序節點
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === 'svg' && b.type !== 'svg') return -1;
      if (a.type !== 'svg' && b.type === 'svg') return 1;
      return a.type.localeCompare(b.type);
    });

    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(roots);
  return roots;
}

function TreeNodeComponent({
  node,
  level = 0,
  selectedComponent,
  onSelectComponent,
  onHoverComponent,
  searchTerm = ''
}: {
  node: TreeNode;
  level?: number;
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  onHoverComponent: (id: string | null) => void;
  searchTerm?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children.length > 0;

  // 檢查搜索匹配
  const isMatch = searchTerm && (
    node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理展開/收起按鈕點擊
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // 處理節點點擊
  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectComponent(node.id);
  };

  if (node.isHidden) return null;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center py-1 px-1 rounded-sm hover:bg-accent/50 transition-colors",
          selectedComponent === node.id && "bg-accent",
          isMatch && "bg-accent/20"
        )}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-accent"
            onClick={handleExpandClick}
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
          onClick={handleNodeClick}
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
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              selectedComponent={selectedComponent}
              onSelectComponent={onSelectComponent}
              onHoverComponent={onHoverComponent}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ComponentTree({
  components,
  selectedComponent,
  onSelectComponent,
  onHoverComponent,
}: ComponentTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const treeData = useMemo(() => {
    return buildTree(components);
  }, [components]);

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
          {treeData.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              沒有可用元件
            </div>
          ) : (
            <div className="space-y-0.5">
              {treeData.map(node => (
                <TreeNodeComponent
                  key={node.id}
                  node={node}
                  selectedComponent={selectedComponent}
                  onSelectComponent={onSelectComponent}
                  onHoverComponent={onHoverComponent}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}