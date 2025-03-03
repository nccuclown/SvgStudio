import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface FileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (content: string, id: number) => void;
}

interface FileListItemProps {
  id: number;
  name: string;
  updatedAt: string;
  onSelect: () => void;
}

function FileListItem({ id, name, updatedAt, onSelect }: FileListItemProps) {
  const date = new Date(updatedAt);
  const formattedDate = date.toLocaleString();

  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex-1">
        <h4 className="text-sm font-medium">{name}</h4>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
}

export function FileDialog({ open, onOpenChange, onFileSelect }: FileDialogProps) {
  const [newFileName, setNewFileName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 查詢檔案列表
  const { data: files = [] } = useQuery({
    queryKey: ['/api/svg/list'],
    queryFn: async () => {
      const response = await fetch('/api/svg/list');
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    }
  });

  // 建立新檔案
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content: '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"></svg>' })
      });
      if (!response.ok) throw new Error('Failed to create file');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/svg/list'] });
      setNewFileName("");
      // 在建立後自動選擇新檔案
      onFileSelect(data.content, data.id);
      onOpenChange(false);
      toast({
        title: "成功",
        description: "檔案已建立",
      });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "建立檔案失敗",
        variant: "destructive",
      });
    }
  });

  // 載入檔案
  const handleFileSelect = async (id: number) => {
    try {
      const response = await fetch(`/api/svg/${id}`);
      if (!response.ok) throw new Error('Failed to load file');
      const data = await response.json();
      onFileSelect(data.content, data.id);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "錯誤",
        description: "載入檔案失敗",
        variant: "destructive",
      });
    }
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入檔案名稱",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newFileName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>檔案管理</DialogTitle>
          <DialogDescription>
            建立新檔案或選擇現有檔案進行編輯。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <form onSubmit={handleCreateFile} className="flex gap-2">
            <Input
              placeholder="輸入新檔案名稱"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <Button type="submit" disabled={createMutation.isPending}>
              建立
            </Button>
          </form>

          <div className="border rounded-md">
            <ScrollArea className="h-[300px]">
              {files.length === 0 ? (
                <p className="text-center p-4 text-muted-foreground">
                  尚未有儲存的檔案
                </p>
              ) : (
                files.map((file: any) => (
                  <FileListItem
                    key={file.id}
                    id={file.id}
                    name={file.name}
                    updatedAt={file.updatedAt}
                    onSelect={() => handleFileSelect(file.id)}
                  />
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}