"use client"

import {useState, useEffect} from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Heart, MapPin, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { ImagePreview } from "@/components/image-preview"
import { apiClient } from "@/lib/api/request"

interface Item {
  id: string
  item_name: string
  description: string
  image_id?: string
  location: string
  contact_info: string
  lost_time: string
  status: "found" | "lost"
  created_at: string
}

export default function HomePage() {
  const [foundItems, setFoundItems] = useState<Item[]>([])
  const [lostItems, setLostItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"found" | "lost">("found")

  useEffect(() => {
    // 请求数据
    apiClient.getFoundItems().then((res) => {
      setFoundItems(res.data.sort((a: { id: number }, b: { id: number }) => b.id - a.id))
    })
    apiClient.getLostItems().then((res) => { 
      setLostItems(res.data.sort((a: { id: number }, b: { id: number }) => b.id - a.id))
    })
  }, [])

  const filteredItems = (activeTab === "found" ? foundItems : lostItems).filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                失物招领
              </h1>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="border-pink-200 text-pink-600 hover:bg-pink-50">
                管理员
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索失物..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-pink-200 focus:border-pink-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex space-x-2 mb-6">
          <Button
            variant={activeTab === "found" ? "default" : "outline"}
            onClick={() => setActiveTab("found")}
            className={`flex-1 rounded-full ${
              activeTab === "found"
                ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white"
                : "border-pink-200 text-pink-600 hover:bg-pink-50"
            }`}
          >
            失物招领 ({foundItems.length})
          </Button>
          <Button
            variant={activeTab === "lost" ? "default" : "outline"}
            onClick={() => setActiveTab("lost")}
            className={`flex-1 rounded-full ${
              activeTab === "lost"
                ? "bg-gradient-to-r from-blue-400 to-cyan-400 text-white"
                : "border-blue-200 text-blue-600 hover:bg-blue-50"
            }`}
          >
            失物登记 ({lostItems.length})
          </Button>
        </div>

        {/* Tips */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg mb-6">
          <p className="text-sm text-pink-500">
            {activeTab === "found"
              ? "所有被游客宝宝和工作人员们发现的失物都会在这里进行展示，如果发现了你的物品，请来到服务台认领哦~"
              : "这些都是游客宝宝们丢失的物品，如果大家有在游玩时看到请将物品带往服务台，谢谢喵~"}
          </p>
        </div>

        {/* Items Grid */}
        <div className="grid gap-4 mb-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <ImagePreview imageId={item.image_id} itemName={item.item_name} className="w-20 h-20 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 truncate">{item.item_name}</h3>
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${
                          item.status === "found" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.status === "found" ? "已找到" : "寻找中"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.location}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(item.lost_time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-pink-400" />
            </div>
            <p className="text-gray-500 mb-4">暂无相关物品</p>
          </div>
        )}

        {/* Floating Action Button */}
        <Link href="/report">
          <Button
            size="lg"
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
