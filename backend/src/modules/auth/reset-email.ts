export function resetEmail(firstName: string, link: string, minutes: number) {
  const text = `Hi ${firstName},\n\nUse this link to choose a new ProjectForge password. It works once and expires in ${minutes} minutes:\n\n${link}\n\nIf you didn't ask for this, you can ignore this email. Your password has not changed.`;
  const html = `<p>Hi ${firstName.replace(/[<>&"]/g, "")},</p><p>Use this link to choose a new ProjectForge password. It works once and expires in ${minutes} minutes.</p><p><a href="${link}">Choose a new password</a></p><p>If you didn't ask for this, you can ignore this email. Your password has not changed.</p>`;
  return { text, html };
}
