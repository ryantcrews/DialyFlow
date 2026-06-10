import { SOCIAL_PROOF, TESTIMONIAL } from './marketingContent';

export function LandingSocialProof() {
  return (
    <section className="mkt-social-proof mkt-band mkt-band-white" aria-label="Social proof">
      <div className="mkt-band-inner">
        <p className="mkt-social-proof-headline">{SOCIAL_PROOF.headline}</p>
        <blockquote className="mkt-testimonial">
          <div className="mkt-testimonial-stars" aria-hidden="true">
            ★★★★★
          </div>
          <p className="mkt-testimonial-quote">&ldquo;{TESTIMONIAL.quote}&rdquo;</p>
          <footer className="mkt-testimonial-author">— {TESTIMONIAL.attribution}</footer>
        </blockquote>
      </div>
    </section>
  );
}
