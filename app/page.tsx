"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, LogOut, MapPin, Loader2, Image as ImageIcon } from "lucide-react"
import type { PhotoJob } from "@/types/lead"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [jobs, setJobs] = useState<PhotoJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.phone) {
      fetchJobs()
    }
  }, [status, session, router])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const phone = (session?.user as { phone?: string })?.phone
      if (!phone) return

      const response = await fetch(`/api/photo-assignments/${phone}`)
      const data = await response.json()

      if (data.success) {
        setJobs(data.assignments || [])
      } else {
        setError(data.error || "Failed to load jobs")
      }
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setError("Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#a4c639] p-2 rounded-lg">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t.jobs.title}</h1>
              <p className="text-xs text-muted-foreground">
                {session?.user?.phone || "Contractor"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.common.signOut}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-4 border border-destructive/20">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="mb-2">{t.jobs.noJobsTitle}</CardTitle>
              <CardDescription>
                {t.jobs.noJobsMessage}
                <br />
                {t.jobs.contactSupervisor}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {t.jobs.yourAssignedJobs} ({jobs.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchJobs}
                disabled={loading}
              >
                {t.common.refresh}
              </Button>
            </div>

            {jobs.map((job) => {
              const streetViewUrl = job.leadAddress
                ? `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodeURIComponent(job.leadAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
                : null
              
              return (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => router.push(`/jobs/${job.leadId}`)}
              >
                {/* Street View Image */}
                {streetViewUrl && (
                  <div className="w-full h-48 bg-slate-200 overflow-hidden">
                    <img
                      src={streetViewUrl}
                      alt={job.leadAddress || "Property"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {job.leadFirstName && job.leadLastName
                          ? `${job.leadFirstName} ${job.leadLastName}`
                          : "Lead"}
                      </CardTitle>
                      {job.leadAddress && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {job.leadAddress}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {job.photoCount || 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {job.leadClaimNumber && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t.jobs.claimNumber}:</span>{" "}
                        <span className="font-medium">{job.leadClaimNumber}</span>
                      </div>
                    )}
                    {job.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t.jobs.instructions}:</span>{" "}
                        <span>{job.notes}</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {t.jobs.assigned} {new Date(job.assignedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-[#a4c639] hover:bg-[#8aaa2a]">
                    <Camera className="h-4 w-4 mr-2" />
                    {t.jobs.openJob}
                  </Button>
                </CardContent>
              </Card>
            )}
            )}
          </div>
        )}
      </main>
    </div>
  )
}
