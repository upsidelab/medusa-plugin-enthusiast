import {useEffect, useState} from "react";
import {adminApiClient} from "../../admin/lib/admin-client";
import {AgentTable} from "./agent-table";
import {LoadingSpinner} from "../../components/utils/spinner";
import {Error} from "../../components/ui/error";

export const EnthusiastMain = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchStatus = async () => {
      try {
        setIsLoading(true)
        await adminApiClient.getStatus()
        if (mounted) {
          setIsConnected(true)
        }
      } catch (err: any) {
        if (mounted) {
          setIsConnected(false)
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
      <LoadingSpinner/>
    )
  }
  if (!isConnected) {
    return (
        <Error heading="Something went wrong." content="Please check your Enthusiast integration." />
    )
  }
  return (
      <AgentTable />
  )
}