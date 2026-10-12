import { AlertTriangle, CheckCircle2 } from "lucide-react";

const checks = [
  ["success", "Structure", "All required chapters are present"],
  ["warning", "References", "2 references are not cited in the document"],
  ["warning", "Figures", "Figure 3.4 is referenced but could not be found"],
  ["success", "Figures", "Figure numbering is consistent"],
  ["success", "Citations", "Citation format matches the selected IEEE style"],
  ["success", "Engineering", "Calculation units are recorded"],
] as const;

export function ValidationList() { return <div className="validation-list">{checks.map(([status, section, message]) => <article className="validation-check card" key={message}>{status === "success" ? <CheckCircle2 color="#12713f" /> : <AlertTriangle color="#a96d00" />}<div><div className="validation-section">{section}</div><p>{message}</p></div><span className={status === "success" ? "check-passed" : "check-warning"}>{status === "success" ? "Passed" : "Review"}</span></article>)}</div>; }
