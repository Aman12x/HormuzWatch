/**
 * Banner for tabs that display analyses which did not survive inference review.
 *
 * These tabs previously presented refuted estimates as findings. The numbers are
 * kept for transparency, but nothing on a tab carrying this banner is a result.
 */
export default function ExploratoryNotice({ children }) {
  return (
    <div
      className="border p-4"
      style={{ borderColor: '#e8b84b44', background: '#e8b84b0d' }}
    >
      <div className="font-mono text-[10px] tracking-[0.2em] mb-2" style={{ color: '#e8b84b' }}>
        EXPLORATORY — NOT REPORTED AS FINDINGS
      </div>
      <p className="text-hw-sub text-sm leading-relaxed font-inter">
        {children}{' '}
        <span className="text-hw-text">
          The project's one reported finding is the OVX volatility result on the Overview tab;
        </span>{' '}
        see METHOD for the specific failure behind each analysis below.
      </p>
    </div>
  )
}
