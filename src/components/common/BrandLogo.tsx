type BrandLogoProps = {
  tone?: 'color' | 'light'
  className?: string
}

export function BrandLogo({ tone = 'color', className = '' }: BrandLogoProps) {
  return (
    <span className={`majhe-kisan-logo majhe-kisan-logo--${tone} ${className}`} role="img" aria-label="माझे Kisan">
      <span className="majhe-kisan-logo__marathi" aria-hidden="true">माझे</span>
      <span className="majhe-kisan-logo__english" aria-hidden="true">
        <svg className="majhe-kisan-logo__sprout" viewBox="0 0 48 42" aria-hidden="true">
          <path className="majhe-kisan-logo__stem" d="M24 41C24 30 24.5 20.5 26 10" />
          <path className="majhe-kisan-logo__leaf" d="M25.5 22C13.5 22.2 6.3 16.4 4 5.2 16.6 4.1 24.7 10.5 25.5 22Z" />
          <path className="majhe-kisan-logo__leaf majhe-kisan-logo__leaf--light" d="M25.2 15.2C27 5.2 34.2.2 45.8 1.8 44 12.1 37.2 17.4 25.2 15.2Z" />
        </svg>
        Kisan
      </span>
    </span>
  )
}
