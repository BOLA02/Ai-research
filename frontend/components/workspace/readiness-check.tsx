"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, PenLine } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Level = "beginner" | "intermediate" | "confident";

const questions = [
  {
    title: "Have you written a project report before?",
    options: ["No, this is my first one", "Yes, a short one such as an assignment or SIWES report", "Yes, a full project or thesis"],
  },
  {
    title: "Do you know what goes in each chapter of your department's report?",
    options: ["Not really", "I know some of it", "Yes, I could list the chapters and what each holds"],
  },
  {
    title: "How comfortable are you citing sources (for example in IEEE or APA style)?",
    options: ["I've never done it", "I've tried it, but I'm not sure I get it right", "Very comfortable"],
  },
];

const outcome: Record<Level, { heading: string; copy: string; primary: [string, string]; secondary: [string, string] }> = {
  beginner: {
    heading: "Let's start with a finished example",
    copy: "Most students find a report much easier to write after they have seen a good one. The walkthrough takes you through a complete project, with notes on why each part works.",
    primary: ["Start the walkthrough", "/example"],
    secondary: ["Go to my projects", "/dashboard"],
  },
  intermediate: {
    heading: "You know the basics",
    copy: "The guidance beside every section will fill the gaps. The worked example is always there if you want to check how a part should look.",
    primary: ["Go to my projects", "/dashboard"],
    secondary: ["Browse the example", "/example"],
  },
  confident: {
    heading: "You're ready to write",
    copy: "Your department's structure and format are built in, so you can focus on the content. The worked example stays available if you ever want a reference.",
    primary: ["Go to my projects", "/dashboard"],
    secondary: ["Browse the example", "/example"],
  },
};

export function ReadinessCheck() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(0 | 1 | 2 | undefined)[]>([undefined, undefined, undefined]);
  const [level, setLevel] = useState<Level | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const question = questions[step];
  const answer = answers[step];

  const choose = (value: 0 | 1 | 2) => setAnswers((current) => current.map((item, index) => (index === step ? value : item)));

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const updated = await completeOnboarding(answers as [number, number, number]);
      setLevel((updated.experienceLevel as Level) ?? "intermediate");
    } catch {
      setError("We couldn't save your answers. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setBusy(true);
    try {
      await completeOnboarding();
      router.replace("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  if (level) {
    const result = outcome[level];
    return (
      <main className="pf-page" style={{ maxWidth: 640 }}>
        <div className="pf-eyebrow">All set</div>
        <h1 style={{ margin: "4px 0 10px", fontSize: 30, letterSpacing: "-0.02em" }}>{result.heading}</h1>
        <p className="pf-lede">{result.copy}</p>
        <div className="pf-actions" style={{ marginTop: 24 }}>
          <Link className="pf-btn pf-btn-primary" href={result.primary[1]}>
            {level === "beginner" ? <BookOpen size={16} aria-hidden /> : <PenLine size={16} aria-hidden />} {result.primary[0]}
          </Link>
          <Link className="pf-btn" href={result.secondary[1]}>{result.secondary[0]}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pf-page" style={{ maxWidth: 640 }}>
      <div className="pf-eyebrow">Welcome{user ? `, ${user.firstName}` : ""}</div>
      <h1 style={{ margin: "4px 0 10px", fontSize: 30, letterSpacing: "-0.02em" }}>Three quick questions</h1>
      <p className="pf-lede">So we can show you the right help. There are no wrong answers, and it takes under a minute.</p>

      <div className="pf-steps" style={{ marginTop: 20 }} aria-label={`Question ${step + 1} of ${questions.length}`}>
        {questions.map((_, index) => <span key={index} className={index === step ? "on" : ""}>{index + 1}</span>)}
      </div>

      {error && <div className="pf-alert" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 19, fontWeight: 700, marginBottom: 14 }}>{question.title}</legend>
        <div style={{ display: "grid", gap: 10 }}>
          {question.options.map((label, index) => (
            <button key={label} type="button" className="pf-type" style={{ padding: 16 }} aria-pressed={answer === index} onClick={() => choose(index as 0 | 1 | 2)}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="pf-actions" style={{ marginTop: 20, justifyContent: "space-between" }}>
        <div className="pf-actions" style={{ margin: 0 }}>
          {step > 0 && <button className="pf-btn" onClick={() => setStep(step - 1)}><ArrowLeft size={16} aria-hidden /> Back</button>}
          {step < questions.length - 1 ? (
            <button className="pf-btn pf-btn-primary" disabled={answer === undefined} onClick={() => setStep(step + 1)}>Next <ArrowRight size={16} aria-hidden /></button>
          ) : (
            <button className="pf-btn pf-btn-primary" disabled={answer === undefined || busy} onClick={submit}>{busy ? "Saving…" : "See my result"}</button>
          )}
        </div>
        <button className="pf-btn pf-btn-ghost" onClick={skip} disabled={busy}>Skip for now</button>
      </div>
    </main>
  );
}
