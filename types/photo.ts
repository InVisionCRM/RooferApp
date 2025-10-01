// Photo-related types for the camera app

export enum PhotoStage {
  Before = "before",
  During = "during",
  After = "after",
  Damage = "damage",
  Materials = "materials",
  Progress = "progress",
  Inspection = "inspection",
  Other = "other",
}

export type CameraFacing = "user" | "environment"

export interface PhotoData {
  name: string
  dataUrl: string
  stage: PhotoStage
  annotations?: string
  description?: string
  tags?: string[]
  createdAt: Date
  leadId?: string
}

export interface SerializedFile {
  name: string
  type: string
  size: number
  base64Data: string
}

export interface PhotoMetadata {
  name: string
  description?: string
  thumbnailUrl: string
  fullUrl: string
  mimeType: string
  size: number
}

export interface UploadedPhoto {
  id: string
  name: string
  description: string | null
  url: string
  thumbnailUrl: string | null
  mimeType: string | null
  size: number | null
  leadId: string
  driveFileId: string | null
  createdAt: Date
  updatedAt: Date
}

