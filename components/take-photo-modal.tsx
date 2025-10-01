"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Keyboard, Pencil, Tag, Camera, X, ChevronLeft, ArrowLeft, Check, Video, Circle } from "lucide-react"
import PhotoCanvas from "./photo-canvas"
import { Carousel, Card } from "@/components/ui/apple-cards-carousel"
import { useLead } from "@/hooks/use-lead"
import { uploadSinglePhoto, updatePhoto } from "@/actions/photo-actions"

interface TakePhotoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  onPhotoSaved?: (photo: {
    id: string
    url: string
    thumbnailUrl: string
    name: string
    description: string | null
    mimeType: string | null
    createdAt: string
    leadId: string
  }) => void
}

export default function TakePhotoModal({ open, onOpenChange, leadId, onPhotoSaved }: TakePhotoModalProps) {
  const { lead } = useLead(leadId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [photoTaken, setPhotoTaken] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagsDrawer, setShowTagsDrawer] = useState(false)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [lastPhoto, setLastPhoto] = useState<{ id: string; url: string } | null>(null)
  const [recentPhotos, setRecentPhotos] = useState<Array<{ id: string; url: string; name: string }>>([])
  const [quickEditOpen, setQuickEditOpen] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDrawDialogOpen, setIsDrawDialogOpen] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [tipsShownThisSession, setTipsShownThisSession] = useState(false)
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])

  const availableTags = [
    "Back Side","Before and After","Bottom","Clock In","Clock Out","Document","East Side",
    "Finished","Front Side","Left Side","New","North Side","Old","Receipt","Right Side",
    "South Side","Start","Top","West Side"
  ]

  // Start/stop camera with modal
  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        if (!open) return
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (cancelled) return
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch {
        // silently ignore
      }
    }
    if (open) {
      start()
    }
    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setPhotoTaken(false)
      setPhotoDataUrl("")
      setDescription("")
      setShowDescriptionPopup(false)
      setIsListening(false)
      setSelectedTags([])
      setShowTagsDrawer(false)
      setShowTips(false)
      setTipsShownThisSession(false)
      setIsVideoMode(false)
      setIsRecording(false)
      setRecordedVideoUrl("")
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null
      }
    }
  }, [open])

  const takePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg")
    setPhotoDataUrl(dataUrl)
    setPhotoTaken(true)
    setTimeout(() => {
      setShowDescriptionPopup(true)
      // Show tips on first photo of this session
      if (!tipsShownThisSession) {
        setShowTips(true)
        setTipsShownThisSession(true)
      }
    }, 200)
  }

  const startRecording = () => {
    if (!streamRef.current) return
    
    try {
      videoChunksRef.current = []
      
      // Find the best supported video format
      // Priority: VP9 > VP8 > H.264 > default
      let mimeType: string | undefined = undefined
      
      const supportedTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus', 
        'video/webm;codecs=h264,opus',
        'video/webm',
      ]
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          console.log('Using video format:', type)
          break
        }
      }
      
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(streamRef.current, options)
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        // Use the actual MIME type from the recorder
        const actualMimeType = mediaRecorder.mimeType
        console.log('Recorded video MIME type:', actualMimeType)
        const videoBlob = new Blob(videoChunksRef.current, { type: actualMimeType })
        const videoUrl = URL.createObjectURL(videoBlob)
        setRecordedVideoUrl(videoUrl)
        setPhotoTaken(true)
        setShowDescriptionPopup(true)
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleMode = () => {
    setIsVideoMode(!isVideoMode)
  }

  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return
    
    interface SpeechRecognitionInterface {
      continuous: boolean
      interimResults: boolean
      lang: string
      onstart: (() => void) | null
      onresult: ((event: unknown) => void) | null
      onerror: ((event: unknown) => void) | null
      onend: (() => void) | null
      start: () => void
    }
    
    const SpeechRecognition = (window as { SpeechRecognition?: { new(): SpeechRecognitionInterface }; webkitSpeechRecognition?: { new(): SpeechRecognitionInterface } }).SpeechRecognition || (window as { SpeechRecognition?: { new(): SpeechRecognitionInterface }; webkitSpeechRecognition?: { new(): SpeechRecognitionInterface } }).webkitSpeechRecognition
    if (!SpeechRecognition) return
    
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: unknown) => {
      try {
        const results = (event as { results?: ArrayLike<{ 0?: { transcript?: string } }> }).results
        const first = results?.[0] as { 0?: { transcript?: string } } | undefined
        const transcript = first?.[0]?.transcript
        if (typeof transcript === "string") {
          setDescription((prev) => prev + (prev ? " " : "") + transcript)
        }
      } catch {}
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const resetForNextShot = () => {
    setPhotoTaken(false)
    setPhotoDataUrl("")
    setRecordedVideoUrl("")
    setDescription("")
    setShowDescriptionPopup(false)
    setIsListening(false)
    setSelectedTags([])
    setShowTagsDrawer(false)
    setIsDrawing(false)
    setIsRecording(false)
  }

  const savePhoto = async () => {
    // Handle video save via API route (bypasses server action size limit)
    if (isVideoMode && recordedVideoUrl) {
      try {
        setIsSaving(true)
        // Fetch the video blob from the object URL
        const response = await fetch(recordedVideoUrl)
        const videoBlob = await response.blob()
        
        const mergedDescription = selectedTags.length > 0 ? `${description ? `${description} ` : ""}[${selectedTags.join(", ")}]` : description
        const lastName = (lead?.lastName || "video").toString().trim().replace(/\s+/g, "_")
        const counter = Math.floor(Date.now() / 1000) % 100000
        
        // Get mime type from blob - will be what MediaRecorder actually used
        const mimeType = videoBlob.type || 'video/webm'
        console.log('Saving video with MIME type:', mimeType, 'Size:', videoBlob.size)
        
        // WebM is the standard output format for most browsers
        const extension = 'webm'
        
        // Create FormData for API upload
        const formData = new FormData()
        const videoFile = new File([videoBlob], `${lastName}-video-${counter}.${extension}`, { type: mimeType })
        formData.append('file', videoFile)
        formData.append('leadId', leadId)
        formData.append('description', mergedDescription)
        
        // Upload via API route
        const uploadResponse = await fetch('/api/photos/upload-video', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error('Upload failed:', errorText)
          throw new Error('Upload failed')
        }
        
        const result = await uploadResponse.json()
        
        if (result.success && result.photo) {
          const saved = {
            id: result.photo.id,
            url: result.photo.url,
            thumbnailUrl: result.photo.thumbnailUrl || result.photo.url,
            name: result.photo.name,
            description: result.photo.description,
            mimeType: result.photo.mimeType,
            createdAt: result.photo.createdAt,
            leadId: result.photo.leadId,
          }
          setLastPhoto({ id: saved.id, url: saved.url })
          setRecentPhotos((prev) => [
            { id: saved.id, url: saved.url, name: saved.name },
            ...prev.slice(0, 4)
          ])
          setSaveNotice("Photo Saved")
          setTimeout(() => setSaveNotice(null), 1200)
          onPhotoSaved?.(saved)
          resetForNextShot()
        }
        setIsSaving(false)
      } catch (error) {
        console.error('Error saving video:', error)
        setIsSaving(false)
      }
      return
    }
    
    // Handle photo save
    if (!photoDataUrl) return
    let base64Data = photoDataUrl
    if (base64Data.includes(",")) base64Data = base64Data.split(",")[1]
    const mergedDescription = selectedTags.length > 0 ? `${description ? `${description} ` : ""}[${selectedTags.join(", ")}]` : description
    // Build filename: Leads lastname-image-#
    const lastName = (lead?.lastName || "photo").toString().trim().replace(/\s+/g, "_")
    const counter = Math.floor(Date.now() / 1000) % 100000 // simple monotonic-ish suffix to avoid collisions
    const serialized = {
      name: `${lastName}-image-${counter}.jpg`,
      type: "image/jpeg",
      size: Math.ceil((base64Data.length * 3) / 4),
      base64Data,
    }
    const result = await uploadSinglePhoto(leadId, serialized, mergedDescription)
    if (result.success && result.photo) {
      const saved = {
        id: result.photo.id,
        url: result.photo.url,
        thumbnailUrl: result.photo.thumbnailUrl || result.photo.url,
        name: result.photo.name,
        description: result.photo.description,
        mimeType: result.photo.mimeType,
        createdAt: result.photo.createdAt.toISOString(),
        leadId: result.photo.leadId,
      }
      setLastPhoto({ id: saved.id, url: saved.url })
      setRecentPhotos((prev) => [
        { id: saved.id, url: saved.url, name: saved.name },
        ...prev.slice(0, 4) // Keep last 5 photos
      ])
      setSaveNotice("Photo Saved")
      setTimeout(() => setSaveNotice(null), 1200)
      onPhotoSaved?.(saved)
      resetForNextShot()
    }
  }

  const handleQuickEditSave = async (annotatedImageUrl: string) => {
    if (!lastPhoto) return
    try {
      await updatePhoto(lastPhoto.id, { imageData: annotatedImageUrl })
      setLastPhoto({ ...lastPhoto, url: annotatedImageUrl })
      setQuickEditOpen(false)
      setSaveNotice("Photo Saved")
      setTimeout(() => setSaveNotice(null), 1200)
    } catch {}
  }

  // Save drawing onto the current captured image (pre-save flow)
  const handleCurrentDrawSave = (annotatedImageUrl: string) => {
    setPhotoDataUrl(annotatedImageUrl)
    setIsDrawing(false)
    setIsDrawDialogOpen(false)
    setShowDescriptionPopup(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 m-0 max-w-full w-full h-[100vh] rounded-none overflow-hidden" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Take Photo</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full bg-black">
          <video ref={videoRef} className="w-full h-full object-cover bg-black" playsInline autoPlay muted />
          
          {/* Close Button */}
          <div className="absolute top-[46px] left-4 z-[60]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-white/90 hover:bg-white"
            >
              Close
            </Button>
          </div>

          {/* Photo/Video Toggle */}
          <div className="absolute top-[46px] right-4 z-[60] flex gap-2">
            <Button
              variant={!isVideoMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsVideoMode(false)}
              className={!isVideoMode ? "bg-[#a4c639] hover:bg-[#8aaa2a]" : "bg-white/90"}
            >
              <Camera className="h-4 w-4 mr-1" />
              Photo
            </Button>
            <Button
              variant={isVideoMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsVideoMode(true)}
              className={isVideoMode ? "bg-[#a4c639] hover:bg-[#8aaa2a]" : "bg-white/90"}
            >
              <Video className="h-4 w-4 mr-1" />
              Video
            </Button>
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-[110px] left-0 right-0 flex justify-center z-[60]">
              <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                <Circle className="h-3 w-3 fill-white" />
                Recording...
              </div>
            </div>
          )}
          
          {/* Persistent capture bar to avoid layout reflows hiding it */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            <div className="h-28" />
          </div>

          {/* Shutter */}
          <div className="fixed bottom-[116px] left-0 right-0 z-[60] flex items-center justify-center gap-6">
            {!isVideoMode ? (
              <Button
                onClick={takePhoto}
                className="bg-lime-400 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white/30"
                type="button"
              >
                <Camera className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`${isRecording ? 'bg-red-600' : 'bg-lime-400'} text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white/30`}
                type="button"
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : (
                  <Circle className="h-8 w-8 fill-white" />
                )}
              </Button>
            )}
          </div>

          {/* Tips Overlay */}
          {showTips && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4 text-black">Quick Tips</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Photo/Video:</span> Toggle between photo and video mode at the top
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mic className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Microphone:</span> Use voice-to-text to dictate your description
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Pencil className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Draw:</span> Annotate photos with drawings or arrows
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Tags:</span> Add location or category tags
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowTips(false)}
                  className="w-full mt-6 bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
                >
                  Got it!
                </Button>
              </div>
            </div>
          )}

          {/* Floating Description Popup */}
          {photoTaken && !isDrawDialogOpen && showDescriptionPopup && (
            <div className="fixed left-0 right-0 bottom-[296px] z-50 flex justify-center px-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-black/5 p-4 w-full max-w-xl">
                {/* Image/Video Preview - Top */}
                <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-100 mb-3">
                  {isVideoMode && recordedVideoUrl ? (
                    <video 
                      src={recordedVideoUrl} 
                      controls 
                      preload="auto"
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={photoDataUrl} alt="Preview" className="w-full h-full object-contain" />
                  )}
                </div>
                
                {/* Description Input */}
                <div className="mb-3">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add description..."
                    className="h-10 border bg-white text-black placeholder-gray-500"
                  />
                </div>
                
                {/* Action Icons */}
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                      onClick={startSpeechRecognition}
                      disabled={isListening}
                      aria-label="Dictate"
                    >
                      {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full" aria-label="Keyboard">
                      <Keyboard className="h-5 w-5" />
                    </Button>
                    {!isVideoMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                        onClick={() => { setShowDescriptionPopup(false); setIsDrawing(true); setIsDrawDialogOpen(true) }}
                        aria-label="Draw"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                      onClick={() => setShowTagsDrawer(true)}
                      aria-label="Tags"
                    >
                      <Tag className="h-5 w-5" />
                    </Button>
                </div>

                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTags.slice(0, 4).map((t) => (
                      <span key={t} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {t}
                      </span>
                    ))}
                    {selectedTags.length > 4 && <span className="text-xs text-gray-600">+{selectedTags.length - 4} more</span>}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={savePhoto} className="h-8 px-2 text-gray-700" disabled={isSaving}>
                    Skip
                  </Button>
                  <Button size="sm" onClick={savePhoto} className="h-8 px-3 bg-[#a4c639] hover:bg-[#8aaa2a] text-black" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Done"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Draw dialog over current capture */}
          <Dialog open={isDrawDialogOpen} onOpenChange={(open) => { setIsDrawDialogOpen(open); if (!open) { setIsDrawing(false); setShowDescriptionPopup(true) } }}>
            <DialogContent className="p-0 m-0 max-w-full w-full h-[100svh] rounded-none overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Draw</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-full">
                {/* Back button overlay */}
                <button className="absolute top-[66px] left-4 z-10 font-bold text-lg bg-black text-white rounded px-3 py-1 shadow flex items-center gap-1" onClick={() => { setIsDrawDialogOpen(false); setIsDrawing(false); setShowDescriptionPopup(true) }} aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <PhotoCanvas 
                  imageUrl={photoDataUrl} 
                  onSave={handleCurrentDrawSave} 
                  saveLabel="Save" 
                  undoLabel="Undo"
                  overlayControls
                  fullScreen
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Save confirmation */}
          {saveNotice && (
            <div className="fixed top-[66px] right-4 z-40 text-[#a4c639] text-sm font-semibold flex items-center gap-1">
              <Check className="h-5 w-5" />
              Photo Saved
            </div>
          )}

          {/* Recent photos stack bottom-left */}
          {recentPhotos.length > 0 && (
            <div className="fixed bottom-[66px] left-4 z-40">
              <button 
                onClick={() => setShowCarousel(true)}
                className="relative block cursor-pointer"
                style={{
                  width: '80px',
                  height: '80px',
                }}
              >
                {recentPhotos.slice(0, 3).map((photo, index) => (
                  <div
                    key={photo.id}
                    className="absolute rounded-lg border-2 border-white/50 shadow-lg overflow-hidden h-20 w-20 transition-transform hover:scale-105 pointer-events-none"
                    style={{
                      top: `-${index * 6}px`,
                      left: `${index * 6}px`,
                      zIndex: recentPhotos.length - index,
                    }}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </button>
            </div>
          )}

          {/* Photo Carousel Modal */}
          {showCarousel && recentPhotos.length > 0 && (
            <div className="fixed inset-0 z-[70] bg-black/90">
              <div className="absolute top-[66px] right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCarousel(false)}
                  className="bg-white/90"
                >
                  Close
                </Button>
              </div>
              <div className="h-full flex items-center justify-center px-4">
                <Carousel
                  items={recentPhotos.map((photo, idx) => (
                    <Card
                      key={photo.id}
                      card={{
                        src: photo.url,
                        title: photo.name,
                        category: `Photo ${recentPhotos.length - idx}`,
                        content: (
                          <div className="space-y-4">
                            <img 
                              src={photo.url} 
                              alt={photo.name}
                              className="w-full h-auto rounded-lg"
                            />
                            <Button
                              onClick={() => {
                                setShowCarousel(false)
                                setLastPhoto(photo)
                                setQuickEditOpen(true)
                              }}
                              className="w-full bg-[#a4c639] hover:bg-[#8aaa2a]"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit This Photo
                            </Button>
                          </div>
                        ),
                      }}
                      index={idx}
                    />
                  ))}
                />
              </div>
            </div>
          )}

          {/* Quick edit overlay for last photo (annotation only) */}
          {quickEditOpen && lastPhoto && (
            <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl bg-background rounded-md p-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2" 
                  onClick={() => setQuickEditOpen(false)}
                >
                  Close
                </Button>
                <PhotoCanvas imageUrl={lastPhoto.url} onSave={handleQuickEditSave} />
              </div>
            </div>
          )}

          {/* Simple tags chooser */}
          {showTagsDrawer && (
            <div className="fixed inset-0 z-[55] bg-black/60 flex items-end md:items-center md:justify-center">
              <div className="w-full md:max-w-md bg-white rounded-t-lg md:rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="w-16"></div>
                  <span className="text-black font-semibold">Tags</span>
                  <Button variant="outline" size="sm" onClick={() => setShowTagsDrawer(false)}>
                    Done
                  </Button>
                </div>
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {availableTags.map((tag) => {
                    const selected = selectedTags.includes(tag)
                    return (
                      <label
                        key={tag}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-md bg-white text-black border ${selected ? 'border-black' : 'border-black/50'} hover:border-2 hover:border-black transition-colors`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleTagToggle(tag)}
                          className="h-4 w-4 accent-black"
                        />
                        <span className="text-sm">{tag}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


