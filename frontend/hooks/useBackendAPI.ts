import { useState, useCallback } from 'react'
import { backendAPI, type QueryAgentResponse, type ProcessFormResponse, type SearchResponse } from '@/lib/api'

export interface UseBackendAPIState {
  loading: boolean
  error: string | null
  data: any | null
}

export function useBackendAPI() {
  const [state, setState] = useState<UseBackendAPIState>({
    loading: false,
    error: null,
    data: null
  })

  const queryAgent = useCallback(async (query: string): Promise<QueryAgentResponse | null> => {
    setState({ loading: true, error: null, data: null })
    
    try {
      const response = await backendAPI.queryAgent(query)
      setState({ loading: false, error: null, data: response })
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState({ loading: false, error: errorMessage, data: null })
      return null
    }
  }, [])

  const processForm = useCallback(async (prompt: string, pdfs?: File[], images?: File[]): Promise<ProcessFormResponse | null> => {
    setState({ loading: true, error: null, data: null })
    
    try {
      const response = await backendAPI.processForm({ prompt, pdfs, images })
      setState({ loading: false, error: null, data: response })
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState({ loading: false, error: errorMessage, data: null })
      return null
    }
  }, [])

  const searchDocuments = useCallback(async (query: string, limit?: number): Promise<SearchResponse | null> => {
    setState({ loading: true, error: null, data: null })
    
    try {
      const response = await backendAPI.searchDocuments(query, limit)
      setState({ loading: false, error: null, data: response })
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState({ loading: false, error: errorMessage, data: null })
      return null
    }
  }, [])

  const healthCheck = useCallback(async (): Promise<boolean> => {
    try {
      await backendAPI.healthCheck()
      return true
    } catch (error) {
      return false
    }
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null })
  }, [])

  return {
    ...state,
    queryAgent,
    processForm,
    searchDocuments,
    healthCheck,
    reset
  }
}
