export default function PartnerLandingPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-6 space-y-16">
        <section className="space-y-6 text-center">
          <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-800">
            Franchise partnerships
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Grow your franchise with Parent Helper
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-600">
            We connect thousands of families with baby and toddler activities across the UK. Partner with us to
            give every franchise location a polished presence, live analytics, and consistent marketing support.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Centralised dashboard",
              body: "See performance for every branch in one place—views, clicks, conversions and more.",
            },
            {
              title: "Upsell-friendly plans",
              body: "Offer head office negotiated discounts while letting franchisees upgrade individually.",
            },
            {
              title: "Bulk onboarding",
              body: "Invite franchisees with custom sign-up links and track their progress from one screen.",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-3 text-gray-600">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Interested? Let’s talk.</h2>
          <p className="text-gray-600">
            Tell us about your franchise network and the number of locations you want to onboard. We’ll share a
            tailored rollout plan, available discounts, and timeline recommendations.
          </p>
          <form className="space-y-4 max-w-2xl">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Your name</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Sarah Thompson"
                  type="text"
                  name="name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business email</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="you@franchise.co.uk"
                  type="email"
                  name="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Franchise brand</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="Baby Sensory"
                type="text"
                name="brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Approximate number of locations</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="e.g. 35"
                type="number"
                name="locations"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Anything else we should know?</label>
              <textarea
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                rows={4}
                placeholder="Tell us about your goals, timelines, or specific requests."
                name="notes"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Contact me about partnership options
            </button>
            <p className="text-sm text-gray-500">
              This form is a placeholder—hook it up to your preferred CRM or email workflow when ready.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
