import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="bg-white border-t border-statBorderGrey py-28 px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-lorryDarkBlack tracking-tight mb-5">
          Ready to get started?
        </h2>
        <p className="text-lg text-inputGrey font-light mb-10">
          Join thousands of customers who buy, repair, and manage their tech with Tek247.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-lorryBlue text-white font-semibold rounded-full text-sm hover:bg-lorryDarkBlue"
          >
            Create free account
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border border-statBorderGrey text-lorryDarkBlack font-semibold rounded-full text-sm hover:border-inputGrey"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
