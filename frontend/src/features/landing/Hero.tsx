import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="bg-white pt-40 pb-28 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        {/* Eyebrow */}
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-lorryBlue tracking-wide mb-6">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-lorryBlue" />
          On-chain escrow for real-world repairs · Powered by Sui
        </p>

        {/* Headline */}
        <h1 className="text-5xl md:text-[72px] font-bold text-lorryDarkBlack leading-[1.05] tracking-tight">
          Pay for repairs
          <br />
          <span className="text-lorryBlue">without the risk.</span>
        </h1>

        {/* Sub */}
        <p className="mt-7 text-lg md:text-xl text-inputGrey max-w-2xl mx-auto leading-relaxed font-light">
          Fund a repair with just your Google account. Your money releases only as
          work is approved — and every fix becomes a verifiable device history that
          survives resale. <span className="text-lorryDarkBlack font-normal">No wallet. No seed phrase. No gas.</span>
        </p>

        {/* CTA row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-lorryBlue text-white font-semibold rounded-full text-base hover:bg-lorryDarkBlue transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#fff" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4-3.2 0-5.85-2.65-5.85-5.9S8.8 6.6 12 6.6c1.85 0 3.1.8 3.8 1.45l2.6-2.5C16.8 3.95 14.6 3 12 3 6.95 3 2.85 7.1 2.85 12.1S6.95 21.2 12 21.2c5.3 0 8.8-3.7 8.8-8.95 0-.6-.05-1.05-.15-1.55z" />
            </svg>
            Continue with Google
          </Link>
          <a
            href="#how-it-works"
            className="px-7 py-3.5 text-lorryBlue font-semibold text-base flex items-center gap-1.5 hover:underline"
          >
            See how it works
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Trust strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-inputGrey">
          <span className="inline-flex items-center gap-1.5"><span className="text-lorryGreen">✔</span> Funds released stage-by-stage</span>
          <span className="inline-flex items-center gap-1.5"><span className="text-lorryGreen">✔</span> Gas sponsored — pay $0 in fees</span>
          <span className="inline-flex items-center gap-1.5"><span className="text-lorryGreen">✔</span> Tamper-proof repair history</span>
        </div>

        {/* Stats */}
        <div className="mt-20 inline-flex flex-wrap justify-center divide-x divide-statBorderGrey">
          {[
            { value: "500+",   label: "Laptops in stock" },
            { value: "2,000+", label: "Happy customers" },
            { value: "24h",    label: "Avg. repair time" },
            { value: "4.9★",   label: "Customer rating" },
          ].map(({ value, label }) => (
            <div key={label} className="px-8 py-2 text-center">
              <p className="text-2xl font-bold text-lorryDarkBlack">{value}</p>
              <p className="text-sm text-inputGrey mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
