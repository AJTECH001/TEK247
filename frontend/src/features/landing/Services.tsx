const services = [
  {
    icon: (
      <svg className="w-7 h-7 text-lorryBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Laptop Store",
    description:
      "Hundreds of configurations — from entry-level to high-performance workstations. Genuine, tested, and warranty-backed.",
    items: ["Windows & macOS", "Business & gaming builds", "Accessories included", "Flexible payment"],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-lorryBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Repair Workshop",
    description:
      "Certified technicians handle screen replacements, battery swaps, motherboard repairs, and data recovery — transparent pricing, always.",
    items: ["Free diagnosis", "Cost estimate upfront", "Real-time status", "Parts & labour warranty"],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-lorryBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Personal Shopper",
    description:
      "Not sure which laptop to buy? Describe your needs and budget — our team curates ranked options built just for you.",
    items: ["Describe your use case", "Expert curation", "Ranked picks", "Buy from the recommendation"],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-lorryBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: "Accessories",
    description:
      "Complete your setup with bags, mice, keyboards, chargers, USB hubs, and external storage — all from trusted brands.",
    items: ["Bags & cases", "Peripherals", "Cables & chargers", "External storage"],
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-pageWhite py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-lorryBlue tracking-wide mb-4">What we offer</p>
          <h2 className="text-4xl md:text-5xl font-bold text-lorryDarkBlack tracking-tight">
            Everything for your tech
          </h2>
          <p className="mt-5 text-lg text-inputGrey max-w-xl mx-auto font-light">
            From buying a new laptop to getting your old one fixed —
            Tek247 covers the full lifecycle of your devices.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(({ icon, title, description, items }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-statBorderGrey p-7"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-lorryBlueBackground flex items-center justify-center mb-6">
                {icon}
              </div>

              <h3 className="text-base font-semibold text-lorryDarkBlack mb-2">{title}</h3>
              <p className="text-sm text-inputGrey leading-relaxed mb-6 font-light">{description}</p>

              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-inputGrey">
                    <div className="w-4 h-4 rounded-full bg-lorryBlue/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-lorryBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
