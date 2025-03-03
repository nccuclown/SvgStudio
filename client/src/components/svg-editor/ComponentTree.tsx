import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FlatComponent } from "@/lib/svg-utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TreeNode {
  id: string;
  type: string;
  parentId?: string;
  attributes: Record<string, string>;
  children: TreeNode[];
  isHidden?: boolean;
}

interface ComponentTreeProps {
  components: FlatComponent[];
  selectedComponentIds: string[];
  onSelectComponent: (id: string | null, isMultiSelect?: boolean) => void;
  onHoverComponent: (id: string | null) => void;
}

// 獲取元素的描述性信息
function getElementDescription(node: TreeNode): string {
  const attrs = node.attributes || {};
  let desc = '';

  // ID資訊
  desc += `ID: ${node.id} `;

  // 文本內容
  if (attrs['_text']) {
    desc += `"${attrs['_text'].slice(0, 20)}${attrs['_text'].length > 20 ? '...' : ''}" `;
  }

  // 位置信息
  const position = [];
  if (attrs.x) position.push(`x:${attrs.x}`);
  if (attrs.y) position.push(`y:${attrs.y}`);
  if (attrs.cx) position.push(`cx:${attrs.cx}`);
  if (attrs.cy) position.push(`cy:${attrs.cy}`);
  if (position.length) {
    desc += `at (${position.join(', ')}) `;
  }

  // 尺寸信息
  const size = [];
  if (attrs.width) size.push(`w:${attrs.width}`);
  if (attrs.height) size.push(`h:${attrs.height}`);
  if (attrs.r) size.push(`r:${attrs.r}`);
  if (size.length) {
    desc += `size(${size.join('×')}) `;
  }

  // 顏色信息
  if (attrs.fill && attrs.fill !== 'none') {
    desc += `fill:${attrs.fill} `;
  }
  if (attrs.stroke && attrs.stroke !== 'none') {
    desc += `stroke:${attrs.stroke} `;
  }

  // 特殊屬性
  if (attrs.class) {
    desc += `class:${attrs.class} `;
  }
  if (attrs.style) {
    desc += `[styled] `;
  }

  return desc.trim();
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
      attributes: comp.attributes || {},
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

      // g 標籤優先顯示
      if (a.type === 'g' && b.type !== 'g') return -1;
      if (a.type !== 'g' && b.type === 'g') return 1;

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
  selectedComponentIds,
  onSelectComponent,
  onHoverComponent,
  searchTerm = ''
}: {
  node: TreeNode;
  level?: number;
  selectedComponentIds: string[];
  onSelectComponent: (id: string | null, isMultiSelect?: boolean) => void;
  onHoverComponent: (id: string | null) => void;
  searchTerm?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0 || node.type === 'g');
  const hasChildren = node.children.length > 0;

  // 元素描述
  const description = getElementDescription(node);

  // 檢查搜索匹配
  const isMatch = searchTerm && (
    node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理展開/收起按鈕點擊
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  if (node.isHidden) return null;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center py-1 px-1 rounded-sm hover:bg-accent/50 transition-colors",
          selectedComponentIds.includes(node.id) && "bg-accent",
          isMatch && "bg-accent/20"
        )}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        <Checkbox 
          checked={selectedComponentIds.includes(node.id)}
          onCheckedChange={(checked) => {
            onSelectComponent(node.id, true);
          }}
          className="mr-2"
        />
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex-1 flex items-center gap-2 cursor-pointer text-sm pl-1 py-0.5"
                onMouseEnter={() => onHoverComponent(node.id)}
                onMouseLeave={() => onHoverComponent(null)}
                onClick={() => onSelectComponent(node.id)}
              >
                <span className={cn(
                  "font-medium",
                  node.type === 'g' && "text-yellow-500",
                  isMatch && "text-primary"
                )}>
                  {node.type}
                </span>
                {description && (
                  <span className="text-muted-foreground text-xs truncate max-w-[300px]">
                    {description}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-bold text-sm">{node.id}</p>
              <p>{description || '無描述'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                路徑: {Array(level).fill('..').join('/')}/<strong>{node.type}</strong>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              selectedComponentIds={selectedComponentIds}
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
  selectedComponentIds,
  onSelectComponent,
  onHoverComponent,
}: ComponentTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const treeData = buildTree(components);

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
                  selectedComponentIds={selectedComponentIds}
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