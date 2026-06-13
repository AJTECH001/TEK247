import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="bg-white pt-40 pb-28 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        {/* Eyebrow */}
        <p className="text-sm font-semibold text-lorryBlue tracking-wide mb-6">
          Nigeria's trusted tech store
        </p>

        {/* Headline */}
        <h1 className="text-5xl md:text-[72px] font-bold text-lorryDarkBlack leading-[1.05] tracking-tight">
          Buy. Repair.
          <br />
          <span className="text-lorryBlue">Manage your tech.</span>
        </h1>

        {/* Sub */}
        <p className="mt-7 text-lg md:text-xl text-inputGrey max-w-2xl mx-auto leading-relaxed font-light">
          Shop premium laptops, book expert repairs, get personalised
          recommendations, and track everything from one dashboard.
        </p>

        {/* CTA row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-7 py-3 bg-lorryBlue text-white font-semibold rounded-full text-sm hover:bg-lorryDarkBlue"
          >
            Get started free
          </Link>
          <a
            href="#services"
            className="px-7 py-3 text-lorryBlue font-semibold text-sm flex items-center gap-1.5 hover:underline"
          >
            See what we offer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
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
