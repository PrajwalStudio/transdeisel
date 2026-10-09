export default function SectionCard({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
      <h3 className="mb-5 border-b border-slate-100 pb-3 text-xl font-bold text-navy">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
