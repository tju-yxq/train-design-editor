import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Loader2, Send, History, Image as ImageIcon, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [userInput, setUserInput] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  // 获取基础图片
  const { data: baseImageData } = trpc.design.getBaseImage.useQuery();

  // 获取当前参数
  const { data: parameters } = trpc.design.getParameters.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // 获取历史记录
  const { data: history, refetch: refetchHistory } = trpc.design.getHistory.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated, refetchInterval: 3000 } // 每3秒轮询一次
  );

  // 提交编辑
  const submitEdit = trpc.design.submitEdit.useMutation({
    onSuccess: (data) => {
      toast.success("提交成功,正在生成图片...", {
        description: `识别到的参数变更: ${JSON.stringify(data.parsedChanges)}`,
      });
      setUserInput("");
      setSelectedHistoryId(data.historyId);
      refetchHistory();
    },
    onError: (error) => {
      toast.error("提交失败", {
        description: error.message,
      });
    },
  });

  // 自动选择最新的历史记录
  useEffect(() => {
    if (history && history.length > 0 && !selectedHistoryId) {
      setSelectedHistoryId(history[0]!.id);
    }
  }, [history, selectedHistoryId]);

  const handleSubmit = () => {
    if (!userInput.trim()) {
      toast.error("请输入修改描述");
      return;
    }
    submitEdit.mutate({ userInput });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">高铁设计图纸编辑系统</CardTitle>
            <CardDescription>
              通过自然语言描述修改高铁车头设计参数,实时生成工程图纸
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" asChild>
              <a href={getLoginUrl()}>
                登录开始使用
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedHistory = history?.find(h => h.id === selectedHistoryId);
  const displayImage = selectedHistory?.generatedImageUrl || baseImageData?.url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">高铁设计图纸编辑系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">欢迎, {user?.name}</span>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧: 图片展示和参数面板 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 图片展示 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  设计图纸
                </CardTitle>
                <CardDescription>
                  {selectedHistory ? (
                    selectedHistory.status === "completed" ? "已生成" :
                    selectedHistory.status === "processing" ? "生成中..." :
                    selectedHistory.status === "failed" ? "生成失败" : "等待中"
                  ) : "基础图纸"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-white rounded-lg border overflow-hidden min-h-[400px] flex items-center justify-center">
                  {selectedHistory?.status === "processing" ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-primary/30" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-foreground">正在生成图片...</p>
                          <p className="text-sm text-muted-foreground mt-1">通常需要5-20秒,请耐心等待</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <span>正在调用阿里云百炼 API...</span>
                        </div>
                      </div>
                    </div>
                  ) : displayImage ? (
                    <img
                      src={displayImage}
                      alt="设计图纸"
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                      <p className="text-sm">正在加载基础图纸...</p>
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 参数面板 */}
            <Card>
              <CardHeader>
                <CardTitle>当前参数</CardTitle>
                <CardDescription>车头设计的关键参数</CardDescription>
              </CardHeader>
              <CardContent>
                {parameters ? (
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">基础参数</TabsTrigger>
                      <TabsTrigger value="head">车头参数</TabsTrigger>
                      <TabsTrigger value="bogie">转向架</TabsTrigger>
                      <TabsTrigger value="other">其他</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ParamItem label="车头总长" value={parameters.headCarTotalLength} unit="mm" />
                        <ParamItem label="最大宽度" value={parameters.maxWidth} unit="mm" />
                        <ParamItem label="最大高度" value={parameters.maxHeight} unit="mm" />
                        <ParamItem label="中心距轨面高度" value={parameters.centerToRailHeight} unit="mm" />
                        <ParamItem label="标准轨距" value={parameters.railGauge} unit="mm" />
                        <ParamItem label="底盘高度" value={parameters.chassisHeight} unit="mm" />
                      </div>
                    </TabsContent>
                    <TabsContent value="head" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ParamItem label="车头长度" value={parameters.trainHeadLength} unit="mm" />
                        <ParamItem label="车头高度" value={parameters.trainHeadHeight} unit="mm" />
                        <ParamItem label="驾驶室高度" value={parameters.cabinHeight} unit="mm" />
                        <ParamItem label="流线型曲率" value={parameters.streamlineCurvature} unit="°" />
                        <ParamItem label="车窗宽度" value={parameters.windowWidth} unit="mm" />
                        <ParamItem label="车窗高度" value={parameters.windowHeight} unit="mm" />
                        <ParamItem label="车钩中心高度" value={parameters.couplerHeight} unit="mm" />
                        <ParamItem label="车头转向架距离" value={parameters.headBogieDistance} unit="mm" />
                        <ParamItem label="雨刮器长度" value={parameters.wiperLength} unit="mm" />
                        <ParamItem label="雨刮器角度" value={parameters.wiperAngle} unit="°" />
                        <ParamItem label="雨刮器位置" value={parameters.wiperPosition} unit="mm" />
                      </div>
                    </TabsContent>
                    <TabsContent value="bogie" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ParamItem label="转向架轴距" value={parameters.bogieAxleDistance} unit="mm" />
                        <ParamItem label="转向架中心距" value={parameters.bogieCenterDistance} unit="mm" />
                        <ParamItem label="轮径" value={parameters.wheelDiameter} unit="mm" />
                      </div>
                    </TabsContent>
                    <TabsContent value="other" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ParamItem label="横截面位置" value={parameters.crossSectionPosition} unit="mm" />
                        <ParamItem label="顶部圆弧半径" value={parameters.topArcRadius} unit="mm" />
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧: 输入和历史记录 */}
          <div className="space-y-6">
            {/* 输入框 */}
            <Card>
              <CardHeader>
                <CardTitle>修改描述</CardTitle>
                <CardDescription>用中文描述您想要的修改</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="例如: 将车头长度增加到11米&#10;例如: 车窗宽度改为1.5米,高度改为1米&#10;例如: 转向架轴距改为2.6米"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitEdit.isPending || !userInput.trim()}
                >
                  {submitEdit.isPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 w-4 h-4" />
                      提交修改
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 历史记录 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  修改历史
                </CardTitle>
                <CardDescription>查看所有修改记录</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {history && history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedHistoryId === item.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedHistoryId(item.id)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-medium line-clamp-2">{item.userInput}</p>
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString("zh-CN")}
                          </p>
                          {item.errorMessage && (
                            <p className="text-xs text-destructive mt-1">{item.errorMessage}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>暂无修改记录</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParamItem({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">
        {value.toLocaleString()}
        <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "等待中", variant: "secondary" },
    processing: { label: "生成中", variant: "default" },
    completed: { label: "已完成", variant: "outline" },
    failed: { label: "失败", variant: "destructive" },
  };

  const config = variants[status] || { label: status, variant: "secondary" };

  return (
    <Badge variant={config.variant} className="shrink-0">
      {config.label}
    </Badge>
  );
}
