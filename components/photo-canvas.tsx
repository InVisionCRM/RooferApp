"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Undo } from "lucide-react"

interface PhotoCanvasProps {
  imageUrl: string
  onSave: (annotatedImageUrl: string) => void
  initialAnnotations?: string
  isSaving?: boolean
  saveLabel?: string
  undoLabel?: string
  fullScreen?: boolean
  overlayControls?: boolean
}

export default function PhotoCanvas({ imageUrl, onSave, initialAnnotations, isSaving, saveLabel, undoLabel, fullScreen, overlayControls }: PhotoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lines, setLines] = useState<Array<{ points: Array<{ x: number; y: number }>; color: string; width: number }>>(
    [],
  )
  const [currentLine, setCurrentLine] = useState<Array<{ x: number; y: number }>>([])
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Initialize canvas and load image
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size based on viewport for fullscreen, or container for normal
    const setCanvasSize = () => {
      // Always use the actual rendered size of the canvas element
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      
      // Redraw after resize
      if (imageLoaded && imageRef.current) {
        drawImageAndLines(imageRef.current, lines)
      }
    }

    // Use requestAnimationFrame to ensure canvas is laid out before sizing
    requestAnimationFrame(() => {
      setCanvasSize()
    })

    // Re-size canvas on window resize (important for mobile orientation changes)
    window.addEventListener('resize', setCanvasSize)

    // Create and load image
    const img = document.createElement('img')
    img.crossOrigin = "anonymous"
    img.src = imageUrl
    imageRef.current = img

    img.onload = () => {
      setImageLoaded(true)
      drawImageAndLines(img, lines)
    }

    img.onerror = (e) => {
      console.error("Error loading image:", e)
    }

    return () => {
      window.removeEventListener('resize', setCanvasSize)
      if (imageRef.current) {
        imageRef.current.onload = null
        imageRef.current.onerror = null
      }
    }
  }, [imageUrl, fullScreen])

  // Redraw canvas when lines change
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      drawImageAndLines(imageRef.current, lines)
    }
  }, [lines, imageLoaded])

  const drawImageAndLines = (
    img: HTMLImageElement,
    currentLines: Array<{ points: Array<{ x: number; y: number }>; color: string; width: number }>,
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate aspect ratio to fit image properly
    const imgRatio = img.width / img.height
    const canvasRatio = canvas.width / canvas.height
    let drawWidth, drawHeight, offsetX, offsetY

    if (imgRatio > canvasRatio) {
      // Image is wider than canvas
      drawWidth = canvas.width
      drawHeight = canvas.width / imgRatio
      offsetX = 0
      offsetY = (canvas.height - drawHeight) / 2
    } else {
      // Image is taller than canvas
      drawHeight = canvas.height
      drawWidth = canvas.height * imgRatio
      offsetX = (canvas.width - drawWidth) / 2
      offsetY = 0
    }

    // Draw image
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

    // Draw all lines
    currentLines.forEach((line) => {
      if (line.points.length < 2) return

      ctx.beginPath()
      ctx.moveTo(line.points[0].x, line.points[0].y)

      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y)
      }

      ctx.strokeStyle = line.color
      ctx.lineWidth = line.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
    })

    // Draw current line
    if (currentLine.length > 1) {
      ctx.beginPath()
      ctx.moveTo(currentLine[0].x, currentLine[0].y)

      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y)
      }

      ctx.strokeStyle = "red"
      ctx.lineWidth = 5
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getPointFromEvent(e)
    if (!point) return

    setIsDrawing(true)
    setCurrentLine([point])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const point = getPointFromEvent(e)
    if (!point) return

    setCurrentLine((prev) => [...prev, point])

    // Draw the current stroke
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx || !imageRef.current) return

    if (currentLine.length > 0) {
      // Redraw everything to avoid artifacts
      drawImageAndLines(imageRef.current, lines)

      // Draw current line
      ctx.beginPath()
      ctx.moveTo(currentLine[0].x, currentLine[0].y)

      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y)
      }

      ctx.lineTo(point.x, point.y)
      ctx.strokeStyle = "red"
      ctx.lineWidth = 5
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return

    if (currentLine.length > 1) {
      const newLine = {
        points: [...currentLine],
        color: "red",
        width: 5,
      }

      setLines((prev) => [...prev, newLine])
    }

    setIsDrawing(false)
    setCurrentLine([])
  }

  const getPointFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      // Touch event
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handleUndo = () => {
    if (lines.length === 0) return
    setLines((prev) => prev.slice(0, -1))
  }

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return

    // Get the canvas data URL with the image and annotations
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.95)

    // Pass the annotated image back to the parent component
    onSave(dataUrl)
  }

  return (
    <div className={`flex flex-col ${overlayControls ? 'h-full w-full' : 'space-y-2'}`}>
      <div className={`relative w-full h-full ${fullScreen ? '' : 'border border-gray-300 rounded-lg'} overflow-hidden`}>
        <canvas
          ref={canvasRef}
          className={`touch-none w-full h-full bg-black`}
          style={fullScreen ? { maxWidth: '100vw', maxHeight: '100vh' } : undefined}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            Loading image...
          </div>
        )}
        {overlayControls && (
          <>
            {/* Undo button - top right */}
            <div className="absolute top-[66px] right-4">
              <Button 
                size="sm" 
                onClick={handleUndo} 
                disabled={lines.length === 0 || isSaving}
                className="bg-black text-white font-bold text-lg hover:bg-black/80 border-white disabled:bg-black/60 disabled:text-white disabled:border-white/60"
              >
                <Undo className="h-4 w-4 mr-1 text-white" />
                {undoLabel || "Undo"}
              </Button>
            </div>
            
            {/* Save button - bottom center */}
            <div className="absolute bottom-[116px] left-0 right-0 px-4 flex justify-center">
              <Button 
                onClick={handleSave}
                size="sm" 
                className="bg-[#a4c639] text-slate-700 font-bold text-lg hover:bg-[#8aaa2a]"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : (saveLabel || "Done")}
              </Button>
            </div>
          </>
        )}
      </div>
      {!overlayControls && (
        <div className="flex justify-between text-white">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={lines.length === 0 || isSaving}>
            <Undo className="h-4 w-4 mr-1 text-white" />
            {undoLabel || "Undo"}
          </Button>
          <Button 
            onClick={handleSave}
            size="sm" 
            className="bg-[#a4c639] text-white hover:bg-[#8aaa2a] text-white"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : (saveLabel || "Done")}
          </Button>
        </div>
      )}
    </div>
  )
}
