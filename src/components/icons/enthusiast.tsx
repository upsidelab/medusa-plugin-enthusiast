import * as React from "react"
import icon from "../../admin/assets/icon.png"

export const EnthusiastIcon = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={icon}
        alt=""
        width={15}
        height={15}
        style={{ objectFit: 'contain', display: 'block' }}
        {...props}
      />
    )
  }
)
EnthusiastIcon.displayName = "EnthusiastIcon"