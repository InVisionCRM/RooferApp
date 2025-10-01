// Lead-related types for the camera app

export enum LeadStatus {
  FollowUps = "follow_ups",
  InProgress = "in_progress",
  Completed = "completed",
  Lost = "lost",
}

export interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  address: string | null
  claimNumber: string | null
  status: LeadStatus
  latitude: number | null
  longitude: number | null
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown> | null
  googleDriveFolderId?: string | null
}

export interface MinimalLead {
  id: string
  address: string | null
  claimNumber: string | null
  firstName: string | null
  lastName: string | null
}

export interface PhotoAssignment {
  id: string
  leadId: string
  contractorPhone: string
  assignedAt: Date
  assignedBy: string
  notes: string | null
  lead?: MinimalLead
}

export interface PhotoJob {
  id: string
  leadId: string
  leadAddress: string | null
  leadClaimNumber: string | null
  leadFirstName: string | null
  leadLastName: string | null
  assignedAt: string
  notes: string | null
  photoCount?: number
}

