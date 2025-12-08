import {useEffect, useState} from "react";
import {adminApiClient} from "../../admin/lib/admin-client";
import {Container} from "@medusajs/ui";
import {AgentTable} from "./agent-table";

export const EnthusiastMain = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchStatus = async () => {
      try {
        setIsLoading(true)
        const res = await adminApiClient.getStatus()

        if (mounted) {
          setIsConnected(res?.connected ?? false)
        }
      } catch (err: any) {
        if (mounted) {
          setError("Failed to load status")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchStatus()

    return () => {
      mounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <Container className="p-4">
        <p>Loading status...</p>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="p-4 text-red-600">
        <p>{error}</p>
      </Container>
    )
  }

  return (
    <Container className="p-4">
      {isConnected ?
        <AgentTable />
      : (
        <div className="p-4 border rounded bg-red-50">
          <h2 className="text-lg font-medium">Not connected</h2>
          <p>Please connect your Enthusiast integration.</p>
        </div>
      )}
    </Container>
  )
}