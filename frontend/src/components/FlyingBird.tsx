export function FlyingBird() {
  return (
    <div className="dakh-bird-sky" aria-hidden="true">
      <div className="dakh-bird-route">
        <div className="dakh-bird-figure">
          <img src="/images/dakh-bird-flight.png" alt="" className="dakh-bird-base" />
          <img src="/images/dakh-bird-flight.png" alt="" className="dakh-bird-ghost" />
        </div>
      </div>
    </div>
  )
}
