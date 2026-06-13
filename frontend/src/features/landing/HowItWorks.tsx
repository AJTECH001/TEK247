const steps = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up in under a minute. No credit card required. Your dashboard is ready instantly.",
  },
  {
    step: "02",
    title: "Browse, request, or book",
    description:
      "Shop laptops and accessories, submit a repair, or use Personal Shopper to get expert picks tailored to your budget.",
  },
  {
    step: "03",
    title: "We handle the rest",
    description:
      "Our team processes your order or repair, keeps you updated at every step, and delivers or notifies you when ready.",
  },
];

const repairSteps = [
  { label: "Submit request",              detail: "Describe the issue and your device" },
  { label: "Free diagnosis",              detail: "Technician assesses and sends you an estimate" },
  { label: "Repair begins",               detail: "You approve the cost and we start work" },
  { label: "Ready for pickup / delivery", detail: "You're notified when it's done" },
];

export default function HowItWorks() {
  return (
    <>
      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-lorryBlue tracking-wide mb-4">How it works</p>
            <h2 className="text-4xl md:text-5xl font-bold text-lorryDarkBlack tracking-tight">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {steps.map(({ step, title, description }) => (
              <div key={step}>
                <p className="text-5xl font-bold text-lorryBlue/15 mb-4 leading-none">{step}</p>
                <h3 className="text-base font-semibold text-lorryDarkBlack mb-2">{title}</h3>
                <p className="text-sm text-inputGrey leading-relaxed font-light">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Repair section ── */}
      <section id="repairs" className="bg-pageWhite py-28 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">

          {/* Left: copy */}
          <div>
            <p className="text-sm font-semibold text-lorryBlue tracking-wide mb-4">Repair service</p>
            <h2 className="text-4xl md:text-5xl font-bold text-lorryDarkBlack tracking-tight mb-6">
              Transparent repairs,<br />start to finish.
            </h2>
            <p className="text-base text-inputGrey leading-relaxed font-light mb-10">
              No surprise bills. You get a free diagnosis and a cost estimate before
              any work begins. Track your repair status in real time from your dashboard.
            </p>

            <ul className="space-y-3.5">
              {[
                "Screen replacement & cracked displays",
                "Battery degradation & charging issues",
                "Keyboard, port & hardware faults",
                "Software, OS & virus removal",
                "Data recovery & storage upgrades",
                "General maintenance & cleaning",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-lorryDarkBlack">
                  <div className="w-5 h-5 rounded-full bg-lorryBlue/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-lorryBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: repair steps — clean light card */}
          <div className="bg-white rounded-2xl border border-statBorderGrey p-8">
            <p className="text-xs font-semibold text-inputGrey uppercase tracking-widest mb-8">Repair journey</p>
            <div>
              {repairSteps.map(({ label, detail }, i) => (
                <div key={label} className="flex gap-5">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-lorryBlue flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    {i < repairSteps.length - 1 && (
                      <div className="w-px flex-1 bg-statBorderGrey my-2" />
                    )}
                  </div>
                  {/* Text */}
                  <div className="pb-8">
                    <p className="text-sm font-semibold text-lorryDarkBlack">{label}</p>
                    <p className="text-xs text-inputGrey mt-0.5 font-light">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
