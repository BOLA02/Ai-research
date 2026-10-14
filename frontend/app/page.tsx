import Link from "next/link";
import { ArrowRight, BookOpenText, Calculator, CheckSquare, Download, Image as ImageIcon, PenLine, Smartphone, Compass } from "lucide-react";

const steps = [
  ["1", "Pick your project type", "Design and construction, or maintenance and repair. Every page, chapter and section your department asks for is set up for you."],
  ["2", "Write one section at a time", "A short step-by-step guide shows what examiners look for in each section and the questions to answer."],
  ["3", "Download a finished Word document", "Paper size, margins, font, spacing, page numbers and the table of contents are all done for you."],
];

const features = [
  [Compass, "Guided writing", "A spotlight guide walks you through every section, one step at a time. It never writes your report for you."],
  [BookOpenText, "References", "Cite in IEEE or APA and switch any time. Citations and the reference list reformat by themselves."],
  [ImageIcon, "Figures and tables", "Upload a diagram or a phone photo. Figures and tables are numbered for you in the order they appear."],
  [Calculator, "Worked calculations", "Enter your values and formulas. The app works out each step and shows the working the way examiners expect."],
  [CheckSquare, "Checks", "See what is missing against your department's rules before you submit, from empty sections to unmatched citations."],
  [Download, "Book view and export", "Read your report page by page like a printed book, then download the Word file."],
] as const;

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <Link href="/" className="lp-brand"><span><PenLine size={16} aria-hidden /></span> ProjectForge</Link>
        <nav aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <Link href="/help">Help</Link>
        </nav>
        <Link className="lp-btn lp-btn-primary" href="/dashboard" prefetch={false}>Open the app <ArrowRight size={15} aria-hidden /></Link>
      </header>

      <main>
        <section className="lp-hero">
          <div>
            <p className="lp-eyebrow">For Electrical and Electronic Engineering HND students</p>
            <h1>Write your final-year report with a guide at every step</h1>
            <p className="lp-lede">ProjectForge sets up your report the way your department wants it, tells you what to write in each section, and builds the finished Word document for you. Made to work on your phone.</p>
            <div className="lp-actions">
              <Link className="lp-btn lp-btn-primary lp-btn-lg" href="/signup">Start your report <ArrowRight size={16} aria-hidden /></Link>
              <Link className="lp-btn lp-btn-lg" href="/help#video">Watch how it works</Link>
            </div>
            <p className="lp-small">Free to try. Follows the Kaduna Polytechnic guidelines.</p>
          </div>
          <Link href="/help#video" className="lp-preview" aria-label="Watch the walkthrough video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/help/poster.jpg" alt="The ProjectForge workspace with a guide open beside the writing area" width={1280} height={580} />
            <span className="lp-play" aria-hidden>Watch the 3 minute tour (with sound)</span>
          </Link>
        </section>

        <section id="how" className="lp-band">
          <div className="lp-wrap">
            <p className="lp-eyebrow">How it works</p>
            <h2>From a blank page to a finished report</h2>
            <ol className="lp-steps">
              {steps.map(([n, title, copy]) => (
                <li key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="lp-wrap lp-features">
          <p className="lp-eyebrow">What you get</p>
          <h2>Everything a project report needs, in one place</h2>
          <div className="lp-grid">
            {features.map(([Icon, title, copy]) => (
              <article key={title}><Icon size={22} aria-hidden /><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </section>

        <section className="lp-wrap lp-phone">
          <Smartphone size={30} aria-hidden />
          <div>
            <h2>Built for your phone</h2>
            <p>Write, add figures from your camera, and read your report like a book, all from a phone. Everything saves by itself as you type.</p>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-wrap lp-cta-inner">
            <h2>Bring order to your final-year project</h2>
            <Link className="lp-btn lp-btn-light lp-btn-lg" href="/signup">Create your account <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </section>
      </main>

      <footer className="lp-wrap lp-foot">
        <span>ProjectForge</span>
        <span><Link href="/help">Help</Link> · <Link href="/login">Sign in</Link></span>
      </footer>
    </div>
  );
}
