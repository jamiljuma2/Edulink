"use client";

import { useEffect, useMemo, useState } from "react";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
};

const seedTestimonials: Testimonial[] = [
  {
    id: "sarah",
    name: "Sarah M.",
    role: "Computer Science Student",
    message:
      "EduLink Writers saved my semester! The quality of work was exceptional, and the admin approval process gave me confidence in every submission.",
    rating: 5,
  },
  {
    id: "james",
    name: "James K.",
    role: "Professional Writer",
    message:
      "As a writer, the subscription model is fair and the M-Pesa integration makes payments seamless. I’ve earned my platinum badge in just 3 months!",
    rating: 5,
  },
  {
    id: "grace",
    name: "Grace A.",
    role: "Business Student",
    message:
      "The wallet system is so convenient. I fund it once and can post multiple assignments. The writers here truly understand academic standards.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(seedTestimonials);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => name.trim().length > 1 && role.trim().length > 1 && message.trim().length > 10,
    [name, role, message]
  );

  useEffect(() => {
    let active = true;
    async function loadTestimonials() {
      try {
        const res = await fetch("/api/testimonials");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "Failed to load testimonials");
        if (active && Array.isArray(json?.testimonials)) {
          setTestimonials(json.testimonials);
        }
      } catch {
        // keep seed testimonials as fallback
      }
    }
    loadTestimonials();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, message, rating }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Submission failed");
      if (json?.testimonial) {
        setTestimonials((prev) => [json.testimonial, ...prev]);
      }
      setName("");
      setRole("");
      setMessage("");
      setRating(5);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pb-16">
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 p-6 shadow-sm">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-emerald-900">What our community says</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Real feedback from students and writers using EduLink.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-md">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <span key={`${item.id}-star-${i}`}>★</span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">“{item.message}”</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  {item.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-100 bg-white p-6 shadow-md">
          <h4 className="text-lg font-semibold text-emerald-900">Leave a testimonial</h4>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Share your experience to help others choose EduLink.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2" aria-busy={loading}>
            <label className="block">
              <span className="text-sm font-medium">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Jane Doe"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Role or title</span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Business Student"
                required
              />
            </label>
            <label className="md:col-span-2 block">
              <span className="text-sm font-medium">Your testimonial</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 min-h-[120px] w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Tell us about your experience..."
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Rating</span>
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={`rate-${value}`}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`text-2xl ${value <= rating ? "text-amber-400" : "text-emerald-200"}`}
                      aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[color:var(--muted)]">
                Testimonials are reviewed before public listing.
                {error && <span className="ml-2 text-red-600">{error}</span>}
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={!canSubmit || loading}
              >
                {loading ? "Submitting..." : submitted ? "Thanks for sharing!" : "Submit testimonial"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
