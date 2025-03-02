import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TreeNode {
  id: string;
  type: string;
  parentId?: string;
  children: TreeNode[];
}

interface ComponentTreeProps {
  components: Array<{ id: string; type: string; parentId?: string }>;
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  onHoverComponent: (id: string | null) => void;
}

function buildTree(components: Array<{ id: string; type: string; parentId?: string }>): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: Create nodes
  components.forEach(comp => {
    nodeMap.set(comp.id, {
      id: comp.id,
      type: comp.type,
      parentId: comp.parentId,
      children: []
    });
  });

  // Second pass: Build tree structure
  components.forEach(comp => {
    const node = nodeMap.get(comp.id)!;
    if (comp.parentId && nodeMap.has(comp.parentId)) {
      nodeMap.get(comp.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function TreeNodeComponent({
  node,
  selectedComponent,
  onSelectComponent,
  onHoverComponent,
  level = 0
}: {
  node: TreeNode;
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  onHoverComponent: (id: string | null) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start pl-0",
            selectedComponent === node.id && "bg-accent"
          )}
          onMouseEnter={() => onHoverComponent(node.id)}
          onMouseLeave={() => onHoverComponent(null)}
          onClick={() => onSelectComponent(node.id)}
        >
          {node.type} ({node.id})
        </Button>
      </div>
      {hasChildren && isExpanded && (
        <div className="pl-4">
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              selectedComponent={selectedComponent}
              onSelectComponent={onSelectComponent}
              onHoverComponent={onHoverComponent}
              level={level + 1}
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
  const treeData = buildTree(components);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold mb-4">Components</h2>
        {treeData.map(node => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            selectedComponent={selectedComponent}
            onSelectComponent={onSelectComponent}
            onHoverComponent={onHoverComponent}
          />
        ))}
      </div>
    </ScrollArea>
  );
}