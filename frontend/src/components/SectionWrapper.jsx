export default function SectionWrapper({ id, eyebrow, title, description, actions, children }) {
  return (
    <section id={id} className="section-anchor fade-up">
      <div className="mb-5 flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">{eyebrow}</p>
          ) : null}
          <h2 className="wrap-anywhere text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-300 md:text-base wrap-anywhere">{description}</p> : null}
        </div>
        {actions ? <div className="flex min-w-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
