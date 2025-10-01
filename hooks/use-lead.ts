import { useState, useEffect } from "react"
import type { Lead } from "@/types/lead"

interface UseLeadReturn {
  lead: Lead | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage lead data
 */
export function useLead(leadId: string): UseLeadReturn {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLead = async () => {
    if (!leadId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/leads/${leadId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch lead: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.lead) {
        setLead(data.lead)
      } else {
        throw new Error(data.error || "Failed to fetch lead")
      }
    } catch (err) {
      console.error("Error fetching lead:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLead()
  }, [leadId])

  return {
    lead,
    loading,
    error,
    refetch: fetchLead,
  }
}

/**
 * Hook to fetch leads assigned to a contractor
 */
export function useContractorLeads(contractorPhone: string) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = async () => {
    if (!contractorPhone) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/photo-assignments/${contractorPhone}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.assignments) {
        // Extract leads from assignments
        const leadsData = data.assignments.map((assignment: { lead: unknown }) => assignment.lead)
        setLeads(leadsData)
      } else {
        throw new Error(data.error || "Failed to fetch assignments")
      }
    } catch (err) {
      console.error("Error fetching contractor leads:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [contractorPhone])

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
  }
}

