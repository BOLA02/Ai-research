import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PenLine } from "lucide-react";

export const metadata: Metadata = { title: "Privacy", description: "What ProjectForge collects, why, and who can see it." };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const UPDATED = "October 2026";

export default function PrivacyPage() {
  return (
    <div className="hp">
      <header className="hp-top">
        <Link href="/" className="hp-brand"><span><PenLine size={16} aria-hidden /></span> ProjectForge</Link>
        <Link href="/" className="hp-open"><ArrowLeft size={15} aria-hidden /> Back</Link>
      </header>
      <div className="hp-layout" style={{ gridTemplateColumns: "minmax(0, 760px)" }}>
        <main className="hp-main">
          <p className="hp-eyebrow">Privacy</p>
          <h1>How ProjectForge handles your information</h1>
          <p className="hp-lede">In plain words: what we keep, why, and who can see it. Last updated {UPDATED}.</p>

          <section>
            <h2>Who runs this</h2>
            <p>ProjectForge is a writing tool for final-year project reports. It is run by its owner, a student project, not by your school. Your school and your supervisor cannot see your work through ProjectForge unless you give them the file yourself.</p>
          </section>

          <section>
            <h2>What we keep</h2>
            <ul>
              <li><strong>Your account.</strong> Your name, email address and a scrambled form of your password. We cannot read your password.</li>
              <li><strong>Your work.</strong> Your project details, the text you write, your references, figures and pictures, tables and calculations.</li>
              <li><strong>How the site is used.</strong> When you sign in or out, which tools you open, which guide steps you reach, when something fails, and your internet address (IP address) when you sign up or sign in. We use this to keep the site safe and to see where students need more help.</li>
            </ul>
            <p>We do not run adverts and we do not sell your information.</p>
          </section>

          <section>
            <h2>Who can see what</h2>
            <ul>
              <li><strong>You</strong> can see everything you wrote.</li>
              <li><strong>The site administrator</strong> can see a list of accounts (name, email, when you last used the site), counts such as how many sections you have started and how many words you have written, and the activity record described above. The administrator&apos;s screens do <strong>not</strong> show what you wrote.</li>
              <li>Whoever looks after the database could technically open it. We do not read students&apos; writing, and would only look at a project to fix a problem you asked us to help with.</li>
            </ul>
          </section>

          <section>
            <h2>Other services that handle your information</h2>
            <p>To run the site we use other companies. Each only receives what it needs:</p>
            <ul>
              <li><strong>Hosting and database</strong> providers store your account and your work.</li>
              <li><strong>Cloudinary</strong>, if switched on, stores the pictures you upload.</li>
              <li><strong>An email service</strong> sends you password-reset emails. It sees your email address.</li>
              <li><strong>The writing coach</strong>, only when you press the button, sends the text of that one section to Anthropic&apos;s Claude so it can suggest improvements. It is not sent at any other time.</li>
            </ul>
          </section>

          <section>
            <h2>Cookies and your browser</h2>
            <p>We use one cookie to keep you signed in. We also use your browser&apos;s storage to remember which guides you have already seen. There are no advertising or tracking cookies.</p>
          </section>

          <section>
            <h2>How long we keep it</h2>
            <p>We keep your account and work until you ask us to delete them. Usage records are kept while the site is running unless you ask us to remove them.</p>
          </section>

          <section>
            <h2>Your choices</h2>
            <p>You can ask to see what we hold about you, to correct it, or to have your account, work and usage records deleted. {contact ? <>Write to <a href={`mailto:${contact}`}>{contact}</a>.</> : <>Ask the person who gave you the link to ProjectForge.</>} You can also delete any project yourself from your projects page.</p>
          </section>

          <section>
            <h2>Changes</h2>
            <p>If we change how we handle your information in a way that matters, we will update this page and the date at the top.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
