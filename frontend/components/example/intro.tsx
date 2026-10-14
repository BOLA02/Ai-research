import Link from "next/link";
import { ArrowRight, Eye, GraduationCap, ShieldAlert } from "lucide-react";
import { EXAMPLE_TITLE, exampleParts } from "@/lib/example/water-level";

const steps = [
  { icon: Eye, title: "Read a real section", copy: "Every part of a finished EEE design report, from the abstract to the references." },
  { icon: GraduationCap, title: "See why it works", copy: "Numbered notes beside each part point to what examiners look for. Click one to highlight it in the text." },
  { icon: ShieldAlert, title: "Avoid common mistakes", copy: "Each part lists the errors students make most often in that section." },
];

export function ExampleIntro() {
  return (
    <div className="pf-section">
      <div className="pf-eyebrow">Worked example</div>
      <h1 style={{ margin: "4px 0 8px", fontSize: 30, letterSpacing: "-0.02em" }}>See a finished report before you write yours</h1>
      <p className="pf-lede">
        This is a complete project, <strong>{EXAMPLE_TITLE}</strong>, laid out the way your department expects. It takes about 15 minutes to read, and it makes your own report much easier to start.
      </p>

      <div className="pf-callout">
        <ShieldAlert size={18} aria-hidden style={{ flex: "none", marginTop: 2 }} />
        <span>The student, the measurements and the cited works are <strong>invented for teaching</strong>. Learn the structure and the style, then write your own work from your own project. Never copy it.</span>
      </div>

      <div className="pf-two" style={{ marginTop: 0 }}>
        {steps.map(({ icon: Icon, title, copy }) => (
          <section key={title} className="pf-card">
            <Icon size={20} aria-hidden color="var(--pf-brand)" />
            <h3 style={{ marginTop: 10 }}>{title}</h3>
            <p className="pf-muted" style={{ margin: 0, lineHeight: 1.5, fontSize: 14 }}>{copy}</p>
          </section>
        ))}
      </div>

      <div className="pf-actions" style={{ marginTop: 28 }}>
        <Link className="pf-btn pf-btn-primary" href={`/example/${exampleParts[0].id}`}>Start the walkthrough <ArrowRight size={16} aria-hidden /></Link>
        <Link className="pf-btn" href="/dashboard">Maybe later</Link>
      </div>
    </div>
  );
}
