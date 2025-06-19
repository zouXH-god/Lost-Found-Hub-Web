"use client"

import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, Clock, Package, LogOut, UserCheck, Search, X, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { ImagePreview } from "@/components/image-preview"
import { apiClient } from "@/lib/api/request"

interface PendingItem {
  id: number
  item_name: string
  description: string
  image_id?: string
  location: string
  contact_info: string
  lost_time: string
  type: "lost" | "found"
  created_at: string
}

interface ApprovedItem extends PendingItem {
  status: "published" | "claimed" | "rejected"
  claimed_by?: string
  claim_time?: string
}

const item_status = {
  pending: {
    name: "待审核",
    css: "bg-gray-500 text-white-900",
  },
  published: {
    name: "已发布",
    css: "bg-yellow-100 text-yellow-700",
  },
  rejected: {
    name: "已驳回",
    css: "bg-red-100 text-red-700",
  },
  claimed: {
    name: "已认领",
    css: "bg-green-100 text-green-700",
  },
}

const sortItemsById = (
    setPendingItems: Dispatch<SetStateAction<PendingItem[]>>,
    setApprovedItems: Dispatch<SetStateAction<ApprovedItem[]>>
) => {
  // 按 id 降序排序 pendingItems
  setPendingItems(prevPendingItems =>
      [...prevPendingItems].sort((a, b) =>  b.id - a.id)
  );

  // 按 id 降序排序 approvedItems
  setApprovedItems(prevApprovedItems =>
      [...prevApprovedItems].sort((a, b) => b.id - a.id)
  );
};


let refreshRunning = false
const refreshData = async (
  setPendingItems: Dispatch<SetStateAction<PendingItem[]>>,
  setApprovedItems: Dispatch<SetStateAction<ApprovedItem[]>>,
  initialOffset: number = 0,
  limit: number = 10
) => {
  if (refreshRunning) return
  refreshRunning = true
  let offset = initialOffset;
  let hasMore = true;
  
  // 先清空现有数据
  setPendingItems([]);
  setApprovedItems([]);
  const itemIds = new Set()

  while (hasMore) {
    try {
      const res = await apiClient.getAllItems({
        offset,
        limit,
      });
      
      // 处理获取到的数据
      const pendingItems: PendingItem[] = [];
      const approvedItems: ApprovedItem[] = [];
      
      res.data.forEach((item) => {
        // 去重
        if (itemIds.has(item.id)) return
        itemIds.add(item.id)
        // 分类
        if (item.status === "pending") {
          pendingItems.push(item);
        } else {
          approvedItems.push(item);
        }
      });

      // 批量更新状态
      setPendingItems(prev => [...prev, ...pendingItems]);
      setApprovedItems(prev => [...prev, ...approvedItems]);
      // 按照 id 降序排序
      sortItemsById(setPendingItems, setApprovedItems)

      // 更新偏移量并检查是否还有更多数据
      offset += res.data.length;
      hasMore = res.data.length === limit;
      if (!hasMore) {
        // 刷新完成，停止运行
        refreshRunning = false
      }
      
    } catch (error) {
      console.error("获取项目数据失败:", error);
      hasMore = false; // 出错时停止获取
      break;
    }
  }
};

export default function AdminDashboard() {
  const router = useRouter()
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [approvedItems, setApprovedItems] = useState<ApprovedItem[]>([])
  // Remove this line: const [stats, setStats] = useState({...})

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  })

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("admin_token")
    const token_expires = localStorage.getItem("admin_token_expires")
    if (!token || !token_expires) {
      router.push("/admin")
      return
    }
    const token_expires_time = new Date(token_expires)
    if (token_expires_time < new Date()) {
      localStorage.removeItem("admin_token")
      localStorage.removeItem("admin_token_expires")
      router.push("/admin")
      return
    }
    apiClient.token = token

    // 请求数据
    refreshData(setPendingItems, setApprovedItems)
  }, [router])

  // Remove the existing filterItems function and replace with useMemo

  const checkTimeFilter = (dateString: string) => {
    if (timeFilter === "all") return true

    const itemDate = new Date(dateString)
    const now = new Date()

    switch (timeFilter) {
      case "today":
        return itemDate.toDateString() === now.toDateString()
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return itemDate >= weekAgo
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        return itemDate >= monthAgo
      case "custom":
        if (!customDateRange.start || !customDateRange.end) return true
        const startDate = new Date(customDateRange.start)
        const endDate = new Date(customDateRange.end)
        return itemDate >= startDate && itemDate <= endDate
      default:
        return true
    }
  }

  // Use useMemo for filtered arrays to prevent infinite loops
  const filteredPendingItems = useMemo(() => {
    return pendingItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact_info.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === "all" || item.type === typeFilter
      const matchesStatus = statusFilter === "all" || statusFilter === "pending"
      const matchesTime = checkTimeFilter(item.created_at)

      return matchesSearch && matchesType && matchesStatus && matchesTime
    })
  }, [pendingItems, searchTerm, typeFilter, statusFilter, timeFilter, customDateRange])

  const filteredApprovedItems = useMemo(() => {
    return approvedItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact_info.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === "all" || item.type === typeFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === item.status)
      const matchesTime = checkTimeFilter(item.created_at)

      return matchesSearch && matchesType && matchesStatus && matchesTime
    })
  }, [approvedItems, searchTerm, typeFilter, statusFilter, timeFilter, customDateRange])

  // Calculate stats directly from filtered arrays using useMemo
  const stats = useMemo(() => {
    return {
      pending: filteredPendingItems.length,
      published: filteredApprovedItems.filter((item) => item.status === "published").length,
      claimed: filteredApprovedItems.filter((item) => item.status === "claimed").length,
      total: filteredPendingItems.length + filteredApprovedItems.length,
    }
  }, [filteredPendingItems, filteredApprovedItems])

  // Remove the problematic useEffect that was updating stats
  // Delete this entire useEffect block:
  // useEffect(() => {
  //   setStats({
  //     pending: filteredPendingItems.length,
  //     approved: filteredApprovedItems.filter((item) => item.status === "approved").length,
  //     claimed: filteredApprovedItems.filter((item) => item.status === "claimed").length,
  //     total: filteredPendingItems.length + filteredApprovedItems.length,
  //   })
  // }, [filteredPendingItems, filteredApprovedItems])

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setTimeFilter("all")
    setCustomDateRange({ start: "", end: "" })
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/admin")
  }

  const handleApprove = async (id: number) => {
    try {
      const item = pendingItems.find((item) => item.id === id)
      if (item) {
        const response = await apiClient.approveItem({ id })
        console.log(response)
        if (response.status === 200) {
          setPendingItems((prev) => prev.filter((item) => item.id !== id))
          setApprovedItems((prev) => [...prev, { ...item, status: "published" as const }])
          alert("审核通过")
        }else {
          alert("操作失败")
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("操作失败")
    }
  }

  const handleReject = async (id: number) => {
    try {
      const item = pendingItems.find((item) => item.id === id)
      if (item) {
        const response = await apiClient.rejectItem({ id })
        if (response.status === 200) {
          setPendingItems((prev) => prev.filter((item) => item.id !== id))
          setApprovedItems((prev) => [...prev, { ...item, status: "rejected" as const }])
          alert("拒绝发布")
        }else {
          alert("操作失败")
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("操作失败")
    }
  }

  const handleMarkClaimed = async (id: number) => {
    const claimedBy = prompt("请输入领取人信息:")
    if (!claimedBy) return

    try {
      const claim_time = new Date().toISOString()
      const response = await apiClient.markClaimed({
        id,
        claimed_by: claimedBy,
      })
      if (response.status === 200) {
        setApprovedItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, status: "claimed" as const, claimed_by: claimedBy, claim_time: claim_time }
              : item,
          ),
        )
        alert("已标记为已认领")
      }else {
        alert("操作失败")
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("操作失败")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              领航员界面
            </h1>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              size="sm"
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              返回首页
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">待审核</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-400 to-emerald-400 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">已发布</p>
                  <p className="text-2xl font-bold">{stats.published}</p>
                </div>
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-400 to-cyan-400 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">已认领</p>
                  <p className="text-2xl font-bold">{stats.claimed}</p>
                </div>
                <UserCheck className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">总计</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选区域 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <Filter className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="font-medium text-gray-800">搜索与筛选</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索物品名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-indigo-400 rounded-lg"
                />
              </div>

              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-200 focus:border-indigo-400 rounded-lg">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(item_status).map(([key, status]) => (
                    <SelectItem key={key} value={key}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 类型筛选 */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-gray-200 focus:border-indigo-400 rounded-lg">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="found">拾物报告</SelectItem>
                  <SelectItem value="lost">失物登记</SelectItem>
                </SelectContent>
              </Select>

              {/* 时间筛选 */}
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="border-gray-200 focus:border-indigo-400 rounded-lg">
                  <SelectValue placeholder="选择时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 自定义时间范围 */}
            {timeFilter === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm text-gray-600">
                    开始日期
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="border-gray-200 focus:border-indigo-400 rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm text-gray-600">
                    结束日期
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="border-gray-200 focus:border-indigo-400 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* 筛选结果统计 */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                找到{" "}
                <span className="font-medium text-indigo-600">
                  {filteredPendingItems.length + filteredApprovedItems.length}
                </span>{" "}
                个结果
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4 mr-1" />
                清除筛选
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">待审核物品 ({filteredPendingItems.length})</TabsTrigger>
            <TabsTrigger value="published">已发布物品 ({filteredApprovedItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {filteredPendingItems.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all" || timeFilter !== "all"
                      ? "没有找到符合条件的物品"
                      : "暂无待审核物品"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPendingItems.map((item) => (
                <Card key={item.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <ImagePreview
                        imageId={item.image_id}
                        itemName={item.item_name}
                        className="w-20 h-20 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">{item.item_name}</h3>
                          <Badge
                            variant="secondary"
                            className={`ml-2 ${
                              item.type === "found" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.type === "found" ? "拾物报告" : "失物登记"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          地点: {item.location} | 时间: {new Date(item.lost_time).toLocaleString()} | 联系: {item.contact_info}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(item.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            拒绝
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            {filteredApprovedItems.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all" || timeFilter !== "all"
                      ? "没有找到符合条件的物品"
                      : "暂无已发布物品"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredApprovedItems.map((item) => (
                <Card key={item.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <ImagePreview
                        imageId={item.image_id}
                        itemName={item.item_name}
                        className="w-20 h-20 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">{item.item_name}</h3>
                          <div className="flex space-x-2">
                            <Badge
                              variant="secondary"
                              className={`${
                                item.type === "found" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.type === "found" ? "拾物报告" : "失物登记"}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`${item_status[item.status].css}`}
                            >
                              {item_status[item.status].name}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          地点: {item.location} | 时间: {new Date(item.lost_time).toLocaleString()} | 联系: {item.contact_info}
                        </p>
                        {item.status === "claimed" && (
                          <p className="text-xs text-green-600 mb-3">
                            已被 {item.claimed_by} 认领于 {new Date(item.claim_time?item.claim_time:"").toLocaleString()}
                          </p>
                        )}
                        {item.status === "published" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkClaimed(item.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            标记已认领
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
