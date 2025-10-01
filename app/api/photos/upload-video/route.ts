import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

// Configure for large video uploads
export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const leadId = formData.get("leadId") as string
    const description = formData.get("description") as string

    if (!file || !leadId) {
      return NextResponse.json(
        { success: false, error: "File and leadId are required" },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const filename = `leads/${leadId}/videos/${timestamp}-${file.name}`

    console.log('Uploading video:', filename, 'Type:', file.type, 'Size:', file.size)

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type, // Ensure correct content-type header
    })

    // Save to database
    const photo = await prisma.leadPhoto.create({
      data: {
        leadId,
        name: file.name,
        description: description || null,
        url: blob.url,
        thumbnailUrl: blob.url,
        mimeType: file.type,
        size: file.size,
        uploadedById: (session.user as any).id || null,
      },
    })

    console.log('Video saved to DB:', {
      id: photo.id,
      url: photo.url,
      mimeType: photo.mimeType,
      size: photo.size
    })

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        name: photo.name,
        description: photo.description,
        mimeType: photo.mimeType,
        createdAt: photo.createdAt,
        leadId: photo.leadId,
      },
    })
  } catch (error) {
    console.error("Error uploading video:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload video" },
      { status: 500 }
    )
  }
}
