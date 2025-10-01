// API response types

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PhotoUploadResponse {
  success: boolean
  photo?: {
    id: string
    url: string
    thumbnailUrl: string
    name: string
    description: string | null
    createdAt: Date
    leadId: string
  }
  error?: string
}

export interface PhotosUploadResponse {
  success: boolean
  photos?: Array<{
    id: string
    url: string
    thumbnailUrl: string
    name: string
    description: string | null
    createdAt: Date
    leadId: string
  }>
  error?: string
}

export interface PhotoAssignmentResponse {
  success: boolean
  assignmentId?: string
  error?: string
}

export interface PhotoAssignmentsListResponse {
  success: boolean
  assignments?: Array<{
    id: string
    leadId: string
    leadAddress: string | null
    leadClaimNumber: string | null
    assignedAt: string
    notes: string | null
  }>
  error?: string
}

export interface DeletePhotoResponse {
  success: boolean
  error?: string
}

