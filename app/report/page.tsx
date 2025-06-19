"use client"

import React, {useEffect} from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, MapPin, Calendar, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {apiClient} from "@/lib/api/request";

export default function ReportPage() {
  useEffect(() => {
    apiClient.token = localStorage.getItem("admin_token")
  }, [])

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [reportType, setReportType] = useState<"lost" | "found">("lost")
  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    location: "",
    contact_info: "",
    lost_time: new Date(),
    image_id: 0
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLoading( true)
      setSelectedImage(file)
      // 上传文件
      apiClient.uploadFile({file}).then((res) => {
        setFormData((prev) => ({ ...prev, image_id: res.data.data.id }))
      }).finally(() => setLoading(false))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 判断类型
      const updateFun = reportType === "lost"
          ? apiClient.reportLost.bind(apiClient)
          : apiClient.reportFound.bind(apiClient);
      // 提交数据
      updateFun({
        item_name: formData.item_name,
        description: formData.description,
        image_id: formData.image_id,
        location: formData.location,
        contact_info: formData.contact_info,
        lost_time: formData.lost_time,
      }).then((res) => {
        console.log(res)
        // 显示成功消息并返回首页
        alert(reportType === "lost" ? "失物登记提交成功，等待管理员审核" : "拾物报告提交成功")
        router.push("/")
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("提交失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              物品登记
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Type Selection */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={reportType === "lost" ? "default" : "outline"}
            onClick={() => setReportType("lost")}
            className={`flex-1 rounded-full ${
              reportType === "lost"
                ? "bg-gradient-to-r from-blue-400 to-cyan-400 text-white"
                : "border-blue-200 text-blue-600 hover:bg-blue-50"
            }`}
          >
            我丢了东西
          </Button>
          <Button
            variant={reportType === "found" ? "default" : "outline"}
            onClick={() => setReportType("found")}
            className={`flex-1 rounded-full ${
              reportType === "found"
                ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white"
                : "border-pink-200 text-pink-600 hover:bg-pink-50"
            }`}
          >
            我捡到东西
          </Button>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">
              {reportType === "lost" ? "失物登记" : "拾物报告"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="item_name" className="text-gray-700 font-medium">
                  物品名称 *
                </Label>
                <Input
                  id="item_name"
                  placeholder="请输入物品名称"
                  value={formData.item_name}
                  onChange={(e) => handleInputChange("item_name", e.target.value)}
                  className="border-gray-200 focus:border-pink-400 rounded-lg"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">
                  物品描述 *
                </Label>
                <Textarea
                  id="description"
                  placeholder="请详细描述物品特征、颜色、大小等"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="border-gray-200 focus:border-pink-400 rounded-lg min-h-[100px]"
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">物品照片</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {selectedImage ? (
                      <div className="space-y-2">
                        <div className="w-32 h-32 mx-auto relative">
                          <img
                            src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
                            alt="预览"
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              // 创建临时预览
                              const tempUrl = URL.createObjectURL(selectedImage)
                              const newWindow = window.open()
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head><title>图片预览</title></head>
                                    <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                                      <img src="${tempUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                                    </body>
                                  </html>
                                `)
                              }
                            }}
                          />
                        </div>
                        <p className="text-sm text-green-600">{selectedImage.name}</p>
                        <p className="text-xs text-gray-500">点击图片预览 • 点击重新选择</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600">点击上传照片</p>
                        <p className="text-xs text-gray-500">支持 JPG、PNG 格式</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {reportType === "lost" ? "丢失地点" : "拾取地点"} *
                </Label>
                <Input
                  id="location"
                  placeholder="请输入具体地点"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="border-gray-200 focus:border-pink-400 rounded-lg"
                  required
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="lost_time" className="text-gray-700 font-medium">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {reportType === "lost" ? "丢失时间" : "拾取时间"} *
                </Label>
                <Input
                  id="lost_time"
                  type="datetime-local"
                  value={formData.lost_time}
                  onChange={(e) => handleInputChange("lost_time", e.target.value)}
                  className="border-gray-200 focus:border-pink-400 rounded-lg"
                  required
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <Label htmlFor="contact_info" className="text-gray-700 font-medium">
                  <User className="w-4 h-4 inline mr-1" />
                  联系方式 {reportType === "lost"? "*" : ""}
                </Label>
                <Input
                  id="contact_info"
                  placeholder="请输入您的姓名和联系方式"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange("contact_info", e.target.value)}
                  className="border-gray-200 focus:border-pink-400 rounded-lg"
                  required={reportType === "lost"}
                />
              </div>

              {/* Submit Button */}
              {loading?(<Button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-3 rounded-lg text-white font-medium ${
                          reportType === "lost"
                              ? "bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500"
                              : "bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500"
                      } transition-all duration-200 disabled:opacity-50`}
                  >
                    图片上传中...
                  </Button>)
                  :(<Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg text-white font-medium ${
                      reportType === "lost"
                          ? "bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500"
                          : "bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500"
                  } transition-all duration-200 disabled:opacity-50`}
              >
                {isSubmitting ? "提交中..." : "提交登记"}
              </Button>)}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h3 className="font-medium text-gray-800">温馨提示</h3>
              <p className="text-sm text-gray-600">
                {reportType === "lost"
                  ? "失物登记需要管理员审核后才会公开显示，请耐心等待。"
                  : "拾物报告提交后将立即显示在失物招领列表中。"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
