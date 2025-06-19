"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { baseURL } from "@/lib/api/request"

interface ImagePreviewProps {
  imageId?: string
  itemName: string
  className?: string
}

export function ImagePreview({ imageId, itemName, className }: ImagePreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageScale, setImageScale] = useState(1)
  const [imageRotation, setImageRotation] = useState(0)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  // 确保组件已挂载（用于Portal）
  useEffect(() => {
    setMounted(true)
  }, [])

  // 根据API文档构建图片URL
  const thumbnailUrl = imageId ? `${baseURL}/api/files/${imageId}?result_type=file&image_type=thumbnail` : "/placeholder.svg?height=80&width=80"
  const originalUrl = imageId ? `${baseURL}/api/files/${imageId}?result_type=file&image_type=original` : "/placeholder.svg?height=800&width=800"
  // const thumbnailUrl = "https://img.xin-hao.top/api/img?id=332&size=300x300"
  // const originalUrl = "https://img.xin-hao.top/api/img?id=332"

  const handleThumbnailClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // 重置图片状态
    setImageScale(1)
    setImageRotation(0)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setImageScale((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setImageScale((prev) => Math.max(prev / 1.2, 0.2))
  }

  const handleRotate = () => {
    setImageRotation((prev) => prev + 90)
  }

  const handleReset = () => {
    setImageScale(1)
    setImageRotation(0)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = originalUrl
    link.download = `${itemName}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageScale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || imageScale <= 1) return
    e.preventDefault()
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  // 键盘快捷键
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          handleCloseModal()
          break
        case "+":
        case "=":
          e.preventDefault()
          handleZoomIn()
          break
        case "-":
          e.preventDefault()
          handleZoomOut()
          break
        case "r":
        case "R":
          e.preventDefault()
          handleRotate()
          break
        case "0":
          e.preventDefault()
          handleReset()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isModalOpen])

  // 模态框组件
  const Modal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer" onClick={handleCloseModal} />

      {/* 图片容器 */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4" onWheel={handleWheel}>
        <img
          src={originalUrl || "/placeholder.svg"}
          alt={itemName}
          className="max-w-full max-h-full object-contain transition-all duration-200 select-none"
          style={{
            transform: `scale(${imageScale}) rotate(${imageRotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            cursor: imageScale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleReset}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=800&width=800"
          }}
          draggable={false}
        />
      </div>

      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-20 bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12 border border-white/20"
        onClick={handleCloseModal}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* 工具栏 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-3 bg-black/60 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
          onClick={handleZoomOut}
          disabled={imageScale <= 0.2}
        >
          <ZoomOut className="w-5 h-5" />
        </Button>

        <span className="text-white text-sm px-3 min-w-[70px] text-center font-medium">
          {Math.round(imageScale * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
          onClick={handleZoomIn}
          disabled={imageScale >= 5}
        >
          <ZoomIn className="w-5 h-5" />
        </Button>

        <div className="w-px h-6 bg-white/30 mx-2" />

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
          onClick={handleRotate}
        >
          <RotateCw className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
          onClick={handleDownload}
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>

      {/* 操作提示 */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 text-white/80 text-sm text-center bg-black/40 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
        <p>双击重置 • 滚轮缩放 • 拖拽移动 • ESC 关闭</p>
      </div>
    </div>
  )

  return (
    <>
      {/* 缩略图 */}
      <div
        className={`${className} cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-105 thumbnail-hover`}
        onClick={handleThumbnailClick}
      >
        <img
          src={thumbnailUrl || "/placeholder.svg"}
          alt={itemName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=80&width=80"
          }}
        />
      </div>

      {/* 使用Portal渲染模态框到body */}
      {isModalOpen && mounted && createPortal(<Modal />, document.body)}
    </>
  )
}
