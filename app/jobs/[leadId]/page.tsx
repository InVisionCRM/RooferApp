"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Camera, ArrowLeft, Loader2, MapPin, FileText, Image as ImageIcon, Trash2, Upload, Phone } from "lucide-react"
import TakePhotoModal from "@/components/take-photo-modal"
import { deletePhoto, uploadSinglePhoto } from "@/actions/photo-actions"
import { toast } from "sonner"
import { FileUpload } from "@/components/ui/file-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  address: string | null
  claimNumber: string | null
  status: string
  photos: Photo[]
}

interface Photo {
  id: string
  name: string
  description: string | null
  url: string
  thumbnailUrl: string | null
  mimeType: string | null
  createdAt: string
}

export default function JobDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const leadId = params.leadId as string
  const { t } = useLanguage()

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cameraOpen, setCameraOpen] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadDescription, setUploadDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchLead()
    }
  }, [status, leadId, router])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads/${leadId}`)
      const data = await response.json()

      if (data.success) {
        setLead(data.lead)
      } else {
        setError(data.error || "Failed to load job details")
      }
    } catch (err) {
      console.error("Error fetching lead:", err)
      setError("Failed to load job details")
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSaved = (photo: Photo) => {
    // Add new photo to the list
    if (lead) {
      setLead({
        ...lead,
        photos: [photo, ...lead.photos],
      })
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm(t.jobs.deleteConfirm)) return

    try {
      setDeletingPhotoId(photoId)
      const result = await deletePhoto(photoId)

      if (result.success) {
        // Remove photo from list
        if (lead) {
          setLead({
            ...lead,
            photos: lead.photos.filter((p) => p.id !== photoId),
          })
        }
        toast.success(t.jobs.photoDeleted)
      } else {
        toast.error(result.error || t.jobs.deleteFailed)
      }
    } catch (err) {
      console.error("Error deleting photo:", err)
      toast.error(t.jobs.deleteFailed)
    } finally {
      setDeletingPhotoId(null)
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) return

    try {
      setIsUploading(true)
      let uploadedCount = 0
      const uploadedPhotos: Photo[] = []

      for (const file of selectedFiles) {
        try {
          // Convert file to base64
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          const base64Data = await base64Promise
          const lastName = (lead?.lastName || "photo").toString().trim().replace(/\s+/g, "_")
          const counter = Math.floor(Date.now() / 1000) % 100000 + uploadedCount

          const serialized = {
            name: `${lastName}-upload-${counter}.${file.name.split('.').pop()}`,
            type: file.type,
            size: file.size,
            base64Data: base64Data.split(',')[1] || base64Data,
          }

          const result = await uploadSinglePhoto(leadId, serialized, uploadDescription)

          if (result.success && result.photo) {
            uploadedCount++
            const saved: Photo = {
              id: result.photo.id,
              url: result.photo.url,
              thumbnailUrl: result.photo.thumbnailUrl || result.photo.url,
              name: result.photo.name,
              description: result.photo.description,
              mimeType: result.photo.mimeType,
              createdAt: result.photo.createdAt.toISOString(),
            }
            
            uploadedPhotos.push(saved)
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)
        }
      }

      // Update state once with all uploaded photos
      if (lead && uploadedPhotos.length > 0) {
        setLead({
          ...lead,
          photos: [...uploadedPhotos, ...lead.photos],
        })
      }

      toast.success(`${uploadedCount} ${t.upload.uploadSuccess}`)
      setUploadDialogOpen(false)
      setSelectedFiles([])
      setUploadDescription("")
    } catch (error) {
      console.error("Error uploading photos:", error)
      toast.error(t.upload.uploadFailed)
    } finally {
      setIsUploading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#a4c639]" />
          <p className="mt-2 text-sm text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.jobs.backToJobs}
          </Button>
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-destructive">{error || "Job not found"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const leadName = lead.firstName && lead.lastName 
    ? `${lead.firstName} ${lead.lastName}` 
    : "Lead"

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.jobs.backToJobs}
            </Button>
            <LanguageSelector />
          </div>
          <h1 className="text-2xl font-bold">{leadName}</h1>
          {lead.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {lead.address}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Lead Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t.jobs.jobDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.claimNumber && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">{t.jobs.claimNumber}:</span>
                <span className="text-sm font-medium">{lead.claimNumber}</span>
              </div>
            )}
            {lead.status && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">{t.jobs.status}:</span>
                <Badge variant="secondary">{lead.status.replace(/_/g, " ")}</Badge>
              </div>
            )}
            <div className="flex items-start justify-between">
              <span className="text-sm text-muted-foreground">{t.jobs.photosTaken}:</span>
              <span className="text-sm font-medium">{lead.photos.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.jobs.jobContact}</span>
              <Button
                size="sm"
                onClick={() => window.location.href = 'tel:+17345894474'}
                className="bg-[#a4c639] hover:bg-[#8aaa2a] text-white"
              >
                <Phone className="h-4 w-4 mr-2" />
                {t.jobs.callButton}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setCameraOpen(true)}
            className="bg-[#a4c639] hover:bg-[#8aaa2a] h-14"
            size="lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            {t.jobs.takePhoto}
          </Button>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            variant="outline"
            className="h-14"
            size="lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            {t.jobs.uploadPhotos}
          </Button>
        </div>

        <Separator />

        {/* Photos Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t.jobs.photos} ({lead.photos.length})
            </h2>
          </div>

          {lead.photos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-lg mb-2">{t.jobs.noPhotosTitle}</CardTitle>
                <CardDescription>
                  {t.jobs.noPhotosMessage}
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {lead.photos.map((photo) => {
                const isVideo = photo.mimeType?.startsWith('video/')
                
                return (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square bg-slate-100 relative">
                    {isVideo ? (
                      <>
                        <video
                          controls
                          preload="metadata"
                          playsInline
                          className="w-full h-full object-cover bg-black"
                          onError={(e) => {
                            const target = e.currentTarget
                            console.error('❌ Video playback error:', {
                              url: photo.url,
                              mimeType: photo.mimeType,
                              error: target.error,
                              networkState: target.networkState,
                              readyState: target.readyState
                            })
                          }}
                          onLoadedMetadata={(e) => {
                            const target = e.currentTarget
                            console.log('✅ Video loaded successfully:', {
                              url: photo.url,
                              mimeType: photo.mimeType,
                              duration: target.duration,
                              videoWidth: target.videoWidth,
                              videoHeight: target.videoHeight
                            })
                          }}
                          onCanPlay={() => {
                            console.log('🎬 Video can play:', photo.url)
                          }}
                        >
                          <source src={photo.url} type={photo.mimeType || 'video/webm'} />
                          Your browser does not support video playback.
                        </video>
                        <div className="absolute bottom-12 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {photo.mimeType || 'unknown type'}
                        </div>
                      </>
                    ) : (
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePhoto(photo.id)
                      }}
                      disabled={deletingPhotoId === photo.id}
                    >
                      {deletingPhotoId === photo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{photo.name}</p>
                    {photo.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              )}
              )}
            </div>
          )}
        </div>
      </main>

      {/* Camera Modal */}
      <TakePhotoModal
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        leadId={leadId}
        onPhotoSaved={handlePhotoSaved}
      />

      {/* Upload Photos Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.upload.uploadPhotos}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <FileUpload onChange={handleFilesSelected} />
            
            {selectedFiles.length > 0 && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t.upload.descriptionLabel}
                    </label>
                    <Input
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder={t.upload.descriptionPlaceholder}
                      className="w-full"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {selectedFiles.length} {t.upload.filesSelected}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false)
                      setSelectedFiles([])
                      setUploadDescription("")
                    }}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    onClick={handleUploadPhotos}
                    disabled={isUploading}
                    className="bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.upload.uploading}
                      </>
                    ) : (
                      `${t.upload.uploadButton} ${selectedFiles.length} ${t.jobs.photos}`
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

