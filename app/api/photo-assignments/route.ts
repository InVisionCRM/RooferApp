import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET - List all photo assignments (Admin only)
 * POST - Create a new photo assignment (Admin only)
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const assignments = await prisma.photoAssignment.findMany({
      where: {
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
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      assignments,
    })
  } catch (error) {
    console.error("Error fetching photo assignments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch assignments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadId, contractorPhone, notes } = body

    if (!leadId || !contractorPhone) {
      return NextResponse.json(
        { success: false, error: "leadId and contractorPhone are required" },
        { status: 400 }
      )
    }

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      )
    }

    // Normalize phone number
    const normalizedPhone = contractorPhone.replace(/\D/g, "")

    // Create photo assignment
    const assignment = await prisma.photoAssignment.create({
      data: {
        leadId,
        contractorPhone: normalizedPhone,
        assignedBy: session.user.id,
        notes: notes || null,
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            claimNumber: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      assignment,
      assignmentId: assignment.id,
    })
  } catch (error) {
    console.error("Error creating photo assignment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create assignment" },
      { status: 500 }
    )
  }
}

