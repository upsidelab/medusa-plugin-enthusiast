import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text } from "@medusajs/ui"
import { useState } from "react"
import { adminSdk } from "../../../lib/sdk"
import { useParams } from "react-router-dom";

const StreamTestPage = () => {
  const { id } = useParams()
  const [messages, setMessages] = useState<string[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [abortStream, setAbortStream] = useState<(() => void) | null>(null)

  const startStream = async () => {
    setIsStreaming(true)
    setMessages([])

    const { stream, abort } = await adminSdk.client.fetchStream(`/enthusiast/conversations/${id}/stream`)

    if (!stream) {
      console.error("Failed to start stream")
      setIsStreaming(false)
      return
    }
    console.log(stream)

    setAbortStream(() => abort)

    try {
      for await (const chunk of stream) {
        console.log("Raw chunk:", chunk)
        const chunkStr = chunk.toString()
        console.log("Chunk as string:", chunkStr)
        
        try {
          // Try to parse as JSON (SDK might already parse SSE data)
          const parsed = typeof chunk === 'string' ? JSON.parse(chunk) : chunk
          console.log("Parsed data:", parsed)
          
          // Format the message for display
          const displayMsg = typeof parsed === 'object' 
            ? JSON.stringify(parsed, null, 2)
            : parsed.toString()
          
          setMessages((prev) => [...prev, displayMsg])
        } catch (e) {
          console.error("Failed to parse chunk:", e, "Raw chunk:", chunkStr)
          // If parsing fails, just display the raw chunk
          setMessages((prev) => [...prev, chunkStr])
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Stream error:", error)
      }
    } finally {
      setIsStreaming(false)
      setAbortStream(null)
    }
  }

  const stopStream = () => {
    if (abortStream) {
      abortStream()
      setIsStreaming(false)
      setAbortStream(null)
    }
  }

  return (
    <Container className="p-6">
      <Heading level="h1" className="mb-6">
        fetchStream JSON Example
      </Heading>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={startStream}
            disabled={isStreaming}
            variant="primary"
          >
            {isStreaming ? "Streaming..." : "Start Stream"}
          </Button>

          <Button
            onClick={stopStream}
            disabled={!isStreaming}
            variant="secondary"
          >
            Stop Stream
          </Button>
        </div>

        <div className="border rounded p-4 h-64 overflow-y-auto bg-ui-bg-subtle">
          {messages.length === 0 ? (
            <Text className="text-ui-fg-muted">No messages yet...</Text>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="mb-2 text-sm">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Stream Test",
})

export default StreamTestPage