interface LighthouseLogoProps {
  className?: string
  size?: number
}

export function LighthouseLogo({
  className = '',
  size = 40,
}: LighthouseLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Proximity/signal rings around lighthouse */}
        <circle
          cx="60"
          cy="70"
          r="45"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="2"
          opacity="0.3"
        />
        <circle
          cx="60"
          cy="70"
          r="35"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="2"
          opacity="0.4"
        />
        
        {/* Location pin markers representing venues */}
        <circle cx="25" cy="50" r="4" fill="#2dd4bf" opacity="0.8" />
        <path
          d="M 25 50 L 25 42 L 22 42 L 25 38 L 28 42 L 25 42 Z"
          fill="#2dd4bf"
          opacity="0.6"
        />
        
        <circle cx="95" cy="60" r="4" fill="#2dd4bf" opacity="0.8" />
        <path
          d="M 95 60 L 95 52 L 92 52 L 95 48 L 98 52 L 95 52 Z"
          fill="#2dd4bf"
          opacity="0.6"
        />
        
        <circle cx="35" cy="95" r="4" fill="#2dd4bf" opacity="0.8" />
        <path
          d="M 35 95 L 35 87 L 32 87 L 35 83 L 38 87 L 35 87 Z"
          fill="#2dd4bf"
          opacity="0.6"
        />
        
        {/* Lighthouse base/tower */}
        <rect
          x="48"
          y="60"
          width="24"
          height="50"
          rx="3"
          fill="url(#lighthouseGradient)"
        />
        
        {/* Lighthouse top/light room */}
        <rect
          x="42"
          y="38"
          width="36"
          height="22"
          rx="3"
          fill="url(#lighthouseGradient)"
        />
        
        {/* Light beam - stronger, more directional */}
        <path
          d="M 60 38 L 35 18 L 85 18 Z"
          fill="url(#lightBeamGradient)"
          opacity="0.7"
        />
        
        {/* Secondary light beam */}
        <path
          d="M 60 38 L 45 22 L 75 22 Z"
          fill="url(#lightBeamGradient2)"
          opacity="0.5"
        />
        
        {/* Light source - brighter */}
        <circle cx="60" cy="49" r="8" fill="#2dd4bf" opacity="0.9" />
        <circle cx="60" cy="49" r="5" fill="#ffffff" opacity="0.9" />
        <circle cx="60" cy="49" r="2" fill="#2dd4bf" />
        
        {/* Lighthouse door */}
        <rect
          x="54"
          y="88"
          width="12"
          height="18"
          rx="2"
          fill="#0f172a"
        />
        
        {/* Lighthouse windows */}
        <rect
          x="51"
          y="68"
          width="8"
          height="10"
          rx="1.5"
          fill="#0f172a"
        />
        <rect
          x="61"
          y="68"
          width="8"
          height="10"
          rx="1.5"
          fill="#0f172a"
        />
        
        {/* Stripes on lighthouse */}
        <rect
          x="48"
          y="73"
          width="24"
          height="4"
          fill="#1e293b"
        />
        <rect
          x="48"
          y="82"
          width="24"
          height="4"
          fill="#1e293b"
        />
        
        {/* Communication/signal lines */}
        <path
          d="M 60 49 L 45 35 M 60 49 L 75 35 M 60 49 L 60 25"
          stroke="#2dd4bf"
          strokeWidth="2"
          opacity="0.4"
          strokeLinecap="round"
        />
        
        <defs>
          <linearGradient
            id="lighthouseGradient"
            x1="60"
            y1="38"
            x2="60"
            y2="110"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient
            id="lightBeamGradient"
            x1="60"
            y1="18"
            x2="60"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient
            id="lightBeamGradient2"
            x1="60"
            y1="22"
            x2="60"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
