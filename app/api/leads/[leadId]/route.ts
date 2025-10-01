import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { leadId } = await params

    // Get the lead with minimal information
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        address: true,
        claimNumber: true,
        status: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        photos: {
          select: {
            id: true,
            name: true,
            description: true,
            url: true,
            thumbnailUrl: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      )
    }

    // Verify contractor has access to this lead
    if (session.user.role === "CONTRACTOR") {
      const hasAccess = await prisma.photoAssignment.findFirst({
        where: {
          leadId: leadId,
          contractorPhone: session.user.phone || "",
          completedAt: null,
        },
      })

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied to this lead" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      lead,
    })
  } catch (error) {
    console.error("Error fetching lead:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch lead" },
      { status: 500 }
    )
  }
}

