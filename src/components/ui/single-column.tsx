import React from "react";

export type SingleColumnLayoutProps = {
  children: React.ReactNode
}

export const SingleColumnLayout = ({ children }: SingleColumnLayoutProps) => {
  return (
    <div className="flex flex-col gap-y-3" style={{ height: `calc(100vh - 78px)` }}>
      {children}
    </div>
  )
}