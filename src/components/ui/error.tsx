export interface ErrorProps {
  heading: string;
  content: string;
}

export function Error({ heading, content }: ErrorProps) {
  return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium">{heading}</h2>
          <p className="text-gray-600">{content}</p>
        </div>
      </div>
    )
}
