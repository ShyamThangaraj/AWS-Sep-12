'use client'

import { useState } from 'react'
import { useBackendAPI } from '@/hooks/useBackendAPI'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function BackendTest() {
  const [testQuery, setTestQuery] = useState('How does FuturaTech use its stock portfolio to fund R&D?')
  const { loading, error, data, queryAgent, healthCheck, reset } = useBackendAPI()
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null)

  const handleTestQuery = async () => {
    if (testQuery.trim()) {
      await queryAgent(testQuery)
    }
  }

  const handleHealthCheck = async () => {
    const isHealthy = await healthCheck()
    setHealthStatus(isHealthy)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Backend API Test</CardTitle>
        <CardDescription>
          Test the connection between the frontend and your FastAPI backend with Weaviate Query Agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Check */}
        <div className="flex items-center gap-4">
          <Button onClick={handleHealthCheck} variant="outline">
            Check Backend Health
          </Button>
          {healthStatus !== null && (
            <Badge variant={healthStatus ? "default" : "destructive"}>
              {healthStatus ? "✅ Backend Healthy" : "❌ Backend Unavailable"}
            </Badge>
          )}
        </div>

        {/* Query Test */}
        <div className="space-y-2">
          <label htmlFor="test-query" className="text-sm font-medium">
            Test Query for Weaviate Query Agent:
          </label>
          <div className="flex gap-2">
            <Input
              id="test-query"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter your question about FuturaTech..."
              className="flex-1"
            />
            <Button onClick={handleTestQuery} disabled={loading || !testQuery.trim()}>
              {loading ? "Querying..." : "Test Query"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-800">Error:</h4>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Query Response:</h4>
              <Button onClick={reset} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Query:</span>
                  <p className="text-sm text-gray-600">{data.query}</p>
                </div>
                <div>
                  <span className="font-medium">Response:</span>
                  <p className="text-sm whitespace-pre-wrap">{data.response}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant={data.status === 'success' ? 'default' : 'secondary'}>
                    {data.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to use:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Make sure your backend server is running on http://localhost:8000</li>
            <li>Click "Check Backend Health" to verify the connection</li>
            <li>Enter a question about FuturaTech or your uploaded documents</li>
            <li>Click "Test Query" to send it to the Weaviate Query Agent</li>
            <li>The response will come from your Gemini-powered AI using your document data</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
