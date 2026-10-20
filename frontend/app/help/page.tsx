import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

export const metadata: Metadata = { title: "How ProjectForge works", description: "A guide to writing your final-year project report with ProjectForge." };

const SECTIONS = [
  ["what", "What it is"],
  ["video", "Watch the video"],
  ["start", "Get started"],
  ["write", "Writing a section"],
  ["format", "Formatting"],
  ["tools", "The tools"],
  ["cover", "Cover and title pages"],
  ["book", "Book view and export"],
  ["phone", "On your phone"],
  ["faq", "Questions and fixes"],
] as const;

const marks: [string, string, string][] = [
  ["**bold**", "Bold", "Select text and tap B, or press Ctrl+B"],
  ["*italic*", "Italic", "Tap I, or Ctrl+I"],
  ["++underline++", "Underline", "Tap U, or Ctrl+U"],
  ["{right}", "Align a paragraph or list item (left, center, right or justify)", "Tap the alignment buttons"],
  ["- item  /  1. item", "Bulleted and numbered lists", "Tap the list buttons"],
  ["[@smith2020]", "A citation, numbered or named for you in IEEE or APA", "Insert, then Citation"],
  ["[fig:block-diagram]", "A figure mention, such as “Figure 3”", "Insert, then Figure"],
  ["[tab:results]", "A table mention, such as “Table 2”", "Insert, then Table"],
  ["[calc:filter-capacitor]", "A worked calculation, shown on its own lines", "Insert, then Calculation"],
];

export default function HelpPage() {
  return (
    <div className="hp">
      <header className="hp-top">
        <Link href="/" className="hp-brand"><span><PenLine size={16} aria-hidden /></span> ProjectForge</Link>
        <Link href="/dashboard" className="hp-open" prefetch={false}>Open the app <ArrowRight size={15} aria-hidden /></Link>
      </header>

      <div className="hp-layout">
        <nav className="hp-toc" aria-label="On this page">
          <strong>On this page</strong>
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <main className="hp-main">
          <p className="hp-eyebrow">Help</p>
          <h1>Write your final-year report, one guided step at a time</h1>
          <p className="hp-lede">ProjectForge sets up your report the way your department wants it, tells you what examiners look for in every section, and builds the finished Word document for you.</p>

          <section id="what">
            <h2>What it is</h2>
            <p>Writing a project report is hard to start because nobody shows you what goes where. ProjectForge does that part for you:</p>
            <ul>
              <li><strong>The structure is ready.</strong> Choose Design and Construction, or Maintenance and Repair. Every front page, chapter and section your department asks for is already there. You choose your own chapter titles.</li>
              <li><strong>Guidance at every section.</strong> A short guide explains what the section is for, asks the questions to answer, and reminds you of common mistakes.</li>
              <li><strong>The tools you need.</strong> References in IEEE or APA, numbered figures and tables, worked calculations, and checks against your department&apos;s rules.</li>
              <li><strong>A finished document.</strong> One tap exports a Word file with the right paper size, margins, font, spacing, page numbers and table of contents.</li>
            </ul>
            <p>It currently follows the Kaduna Polytechnic Electrical and Electronic Engineering HND guidelines.</p>
          </section>

          <section id="video">
            <h2>Watch the video</h2>
            <p>A 3 minute narrated walkthrough, from sign-up to the Word download. Turn your sound on.</p>
            <video className="hp-video" controls preload="metadata" playsInline poster="/help/poster.jpg">
              <source src="/help/projectforge-walkthrough.mp4" type="video/mp4" />
              Your browser can&apos;t play this video. You can follow the written steps below instead.
            </video>
          </section>

          <section id="start">
            <h2>Get started</h2>
            <ol className="hp-steps">
              <li><strong>Create an account.</strong> Use your own email address so you can reset your password later. Choose <em>Sign up</em> on the sign-in page.</li>
              <li><strong>Answer three quick questions.</strong> They tell us how much help to show you. Every guide stays available later whatever you answer.</li>
              <li><strong>Start a project.</strong> Choose <em>New project</em>, pick Design and Construction or Maintenance and Repair, and type your project title.</li>
              <li><strong>Take the tour.</strong> The project page offers a short spotlight tour of the outline, tools and deadlines. Tap <em>Show me around</em> whenever you want it again.</li>
              <li><strong>Add your details.</strong> Open <em>Project details</em> and fill in your name, registration number and supervisor once. They fill the cover, title page, declaration and approval page.</li>
              <li><strong>Write, section by section.</strong> Use <em>Start writing</em> or choose any part from the outline. Everything saves by itself.</li>
            </ol>
          </section>

          <section id="write">
            <h2>Writing a section</h2>
            <p>Each section page has the writing area and a short guide card. Tap <strong>Guide me</strong> and the page dims except for the part to look at. A card walks you through it one step at a time:</p>
            <ul>
              <li><strong>What examiners expect.</strong> Why the section exists and what a good one contains.</li>
              <li><strong>Questions to answer.</strong> One at a time. Tap <em>Add this question to my text</em> to put it in your document, then answer under it.</li>
              <li><strong>Keep in mind.</strong> The common mistakes to avoid.</li>
              <li><strong>Check your work.</strong> The writing coach reads what you wrote and points out what to improve. It never writes your report for you. It is only available when it has been switched on for your site.</li>
            </ul>
            <p>Use <strong>Undo</strong> and <strong>Redo</strong> (or Ctrl+Z and Ctrl+Y) at any time. <strong>Preview</strong> shows how your citations, figure numbers and formatting will read. The word count is under the writing area, and a green dot in the outline marks every part you have started.</p>
          </section>

          <section id="format">
            <h2>Formatting</h2>
            <p>Use the toolbar and menus. Behind the scenes they add small marks to your text, which is why you may see things like <code>**word**</code> while you write. The Preview tab and the Word file show the real formatting.</p>
            <div className="hp-table-wrap">
              <table className="hp-table">
                <thead><tr><th>You see</th><th>It means</th><th>How to add it</th></tr></thead>
                <tbody>{marks.map(([mark, meaning, how]) => <tr key={mark}><td><code>{mark}</code></td><td>{meaning}</td><td>{how}</td></tr>)}</tbody>
              </table>
            </div>
            <p>Normal paragraphs are justified to both edges, as your department asks. Use the alignment buttons only where you want something different, such as a centred line or a right-aligned date.</p>
          </section>

          <section id="tools">
            <h2>The tools</h2>
            <p>Each tool opens a short guide the first time you use it. Tap <strong>Guide me</strong> to see it again.</p>
            <div className="hp-cards">
              <article><h3>Project details</h3><p>Your name, registration number, supervisor, head of department and the rest. Typed once, printed on the right pages.</p></article>
              <article><h3>References</h3><p>Add each book, paper or website. Choose IEEE or APA at any time and every citation and the reference list reformat. Insert a citation from the Insert menu while you write.</p></article>
              <article><h3>Figures</h3><p>Circuit diagrams, photos and charts. Upload a picture (large phone photos are shrunk for you), give it a caption and a section. Figures are numbered in the order they appear.</p></article>
              <article><h3>Tables</h3><p>Results and specifications. Add rows and columns, then save. Tables are numbered separately from figures.</p></article>
              <article><h3>Calculations</h3><p>Enter your values and the formulas. ProjectForge works out each step and writes the working the way examiners expect, so a wrong answer cannot slip into your report. Values like 4.7k and 100m work.</p></article>
              <article><h3>Checks</h3><p>Compares your report with your department&apos;s guidelines: empty sections, missing details, citations that match no source, and more. Errors come first, then warnings.</p></article>
            </div>
          </section>

          <section id="cover">
            <h2>Cover and title pages</h2>
            <p>These pages are built for you, so there is nothing to type in the page itself. Open <strong>Cover Page</strong> or <strong>Title Page</strong> in the outline. At the top is a small form with your full name, registration number and graduation year. Type them and the page fills in as you go, then tap <strong>Save</strong>. Your supervisor, school and college are under <em>Project details</em>.</p>
          </section>

          <section id="book">
            <h2>Book view and export</h2>
            <p><strong>Book view</strong> shows your report page by page, like opening a printed book: cover first, then the front matter, chapters, references and appendices. Turn pages with the buttons, the arrow keys, or by swiping on a phone, and jump to any chapter from the list. It also shows your page count against the 50 to about 120 pages your department asks for.</p>
            <p>Page breaks are close to Word&apos;s but not always identical. <strong>Export</strong> downloads the Word document itself, set up as follows:</p>
            <ul>
              <li>A4 paper, Times New Roman 12 pt, 1.5 line spacing, margins of 25 mm left and 20 mm elsewhere.</li>
              <li>The front pages numbered in roman numerals at the bottom centre. The title page is counted but shows no number.</li>
              <li>Body pages numbered from 1. The first page of each chapter has its number at the bottom centre, and the other pages have it at the top right.</li>
              <li>A table of contents and lists of figures and tables. In Word, if the page numbers look wrong, right-click the table and choose <em>Update field</em>.</li>
            </ul>
          </section>

          <section id="phone">
            <h2>On your phone</h2>
            <ul>
              <li>Open the outline with the menu button at the top left. Everything in the app is reachable from it.</li>
              <li>The guide card sits above the writing area. Tap <em>Guide me</em> for the step-by-step spotlight.</li>
              <li>The formatting buttons scroll sideways. Undo and Redo are the first two.</li>
              <li>When you add a figure, take the photo with your camera or choose one from your gallery.</li>
              <li>In Book view, swipe left or right to turn the page.</li>
            </ul>
          </section>

          <section id="faq">
            <h2>Questions and fixes</h2>
            <details><summary>The first page was slow to open.</summary><p>The site may have been asleep. The first visit after a quiet period can take up to a minute. After that it is quick.</p></details>
            <details><summary>I forgot my password.</summary><p>On the sign-in page choose <em>Forgot your password?</em>, enter your email, and open the link we send. The link works once and expires in an hour. Check your spam folder. Resetting signs you out everywhere.</p></details>
            <details><summary>Did my writing save?</summary><p>Look for <em>Saved</em> under the writing area. If it says it couldn&apos;t save, your text is still on the screen. Keep typing or check your connection, and it will try again.</p></details>
            <details><summary>My picture won&apos;t upload.</summary><p>Check your connection and try again. Very large images are shrunk before upload; if it is still too large, choose a smaller one.</p></details>
            <details><summary>The table of contents shows no page numbers in Word.</summary><p>Right-click the table of contents and choose <em>Update field</em>, then <em>Update entire table</em>.</p></details>
            <details><summary>The writing coach isn&apos;t there.</summary><p>The coach is optional and only appears when it has been switched on for your site. Everything else works without it.</p></details>
            <details><summary>Who can see what I write?</summary><p>Only you. The site administrator sees account details and counts such as how many sections you have started, never your text. Read the full <Link href="/privacy">privacy note</Link>.</p></details>
            <details><summary>Can I use this for another department?</summary><p>Today only the Electrical and Electronic Engineering HND templates exist. Other departments need their own template.</p></details>
          </section>

          <div className="hp-cta">
            <h2>Ready to start?</h2>
            <Link href="/dashboard" className="hp-open" prefetch={false}>Open the app <ArrowRight size={15} aria-hidden /></Link>
          </div>
        </main>
      </div>
    </div>
  );
}
