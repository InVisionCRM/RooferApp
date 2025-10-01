import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET - Get photo assignments for a specific contractor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { contractorPhone: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const contractorPhone = params.contractorPhone
    const normalizedPhone = contractorPhone.replace(/\D/g, "")

    // Verify contractor is accessing their own assignments
    if (
      session.user.role === "CONTRACTOR" &&
      session.user.phone !== normalizedPhone
    ) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    // Get active photo assignments
    const assignments = await prisma.photoAssignment.findMany({
      where: {
        contractorPhone: normalizedPhone,
        completedAt: null, // Only active assignments
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            claimNumber: true,
            photos: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    })

    // Transform to PhotoJob format
    const jobs = assignments.map((assignment) => ({
      id: assignment.id,
      leadId: assignment.leadId,
      leadAddress: assignment.lead.address,
      leadClaimNumber: assignment.lead.claimNumber,
      leadFirstName: assignment.lead.firstName,
      leadLastName: assignment.lead.lastName,
      assignedAt: assignment.assignedAt.toISOString(),
      notes: assignment.notes,
      photoCount: assignment.lead.photos.length,
    }))

    return NextResponse.json({
      success: true,
      assignments: jobs,
    })
  } catch (error) {
    console.error("Error fetching contractor assignments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch assignments" },
      { status: 500 }
    )
  }
}

