"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Camera, ArrowLeft, Loader2, MapPin, FileText, Image as ImageIcon, Trash2 } from "lucide-react"
import TakePhotoModal from "@/components/take-photo-modal"
import { deletePhoto } from "@/actions/photo-actions"
import { toast } from "sonner"

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

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cameraOpen, setCameraOpen] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

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
    if (!confirm("Are you sure you want to delete this photo?")) return

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
        toast.success("Photo deleted")
      } else {
        toast.error(result.error || "Failed to delete photo")
      }
    } catch (err) {
      console.error("Error deleting photo:", err)
      toast.error("Failed to delete photo")
    } finally {
      setDeletingPhotoId(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#a4c639]" />
          <p className="mt-2 text-sm text-muted-foreground">Loading job...</p>
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
            Back to Jobs
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
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
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
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.claimNumber && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Claim Number:</span>
                <span className="text-sm font-medium">{lead.claimNumber}</span>
              </div>
            )}
            {lead.status && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="secondary">{lead.status.replace(/_/g, " ")}</Badge>
              </div>
            )}
            <div className="flex items-start justify-between">
              <span className="text-sm text-muted-foreground">Photos Taken:</span>
              <span className="text-sm font-medium">{lead.photos.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Camera Button */}
        <Button
          onClick={() => setCameraOpen(true)}
          className="w-full bg-[#a4c639] hover:bg-[#8aaa2a] h-14"
          size="lg"
        >
          <Camera className="h-5 w-5 mr-2" />
          Take Photo
        </Button>

        <Separator />

        {/* Photos Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Photos ({lead.photos.length})
            </h2>
          </div>

          {lead.photos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-lg mb-2">No Photos Yet</CardTitle>
                <CardDescription>
                  Tap "Take Photo" above to capture your first photo
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
    </div>
  )
}

