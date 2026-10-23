// Génère les modèles d'email Supabase Auth (à coller dans Dashboard → Authentication → Email Templates).
// Variables Supabase : {{ .ConfirmationURL }}, {{ .Email }}, {{ .NewEmail }}.
import { writeFileSync } from 'node:fs'

const layout = ({ title, intro, cta, outro }) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F3;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

        <tr>
          <td align="center" style="padding-bottom:32px;">
            <div style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:30px;font-weight:600;letter-spacing:0.1em;color:#0D1323;">FESTILA</div>
            <div style="width:32px;height:2px;background:#D4A373;margin:12px auto 0;border-radius:999px;line-height:2px;font-size:0;">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td style="background:#FFFFFF;border:1px solid #EDE3D5;border-radius:20px;padding:40px 32px;">
            <h1 style="margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1A1208;text-align:center;">${title}</h1>
            <p style="margin:0 0 28px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#6B5E50;text-align:center;">${intro}</p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td align="center" style="border-radius:999px;background:#E787B2;">
                  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 32px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:999px;">${cta}</a>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;line-height:19px;color:#9B8E7E;text-align:center;">${outro}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 8px 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;line-height:17px;color:#9B8E7E;text-align:center;">
            Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :<br>
            <a href="{{ .ConfirmationURL }}" style="color:#D4A373;word-break:break-all;">{{ .ConfirmationURL }}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;color:#B5A898;text-align:center;">
            © Festila — Des événements inoubliables
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

const templates = {
  'reset-password': {
    subject: 'Réinitialisez votre mot de passe Festila',
    title: 'Nouveau mot de passe',
    intro: 'Vous avez demandé à réinitialiser le mot de passe de votre compte Festila ({{ .Email }}). Cliquez sur le bouton ci-dessous pour en choisir un nouveau.',
    cta: 'Choisir un mot de passe →',
    outro: 'Ce lien est valable une heure et ne peut servir qu\'une fois. Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement cet email : votre mot de passe reste inchangé.',
  },
  'confirm-signup': {
    subject: 'Bienvenue sur Festila — confirmez votre adresse email',
    title: 'Bienvenue sur Festila',
    intro: 'Merci de votre inscription ! Il ne reste qu\'une étape : confirmez votre adresse email pour commencer à organiser vos événements.',
    cta: 'Confirmer mon email →',
    outro: 'Si vous n\'avez pas créé de compte sur Festila, vous pouvez ignorer cet email.',
  },
  'magic-link': {
    subject: 'Votre lien de connexion Festila',
    title: 'Connexion à Festila',
    intro: 'Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Festila, sans mot de passe.',
    cta: 'Me connecter →',
    outro: 'Ce lien est valable une heure et ne peut servir qu\'une fois. Si vous n\'avez rien demandé, ignorez cet email.',
  },
  'change-email': {
    subject: 'Confirmez votre nouvelle adresse email Festila',
    title: 'Changement d\'adresse email',
    intro: 'Vous avez demandé à remplacer {{ .Email }} par {{ .NewEmail }} pour votre compte Festila. Confirmez ce changement en cliquant ci-dessous.',
    cta: 'Confirmer le changement →',
    outro: 'Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email et changez votre mot de passe par précaution.',
  },
}

const subjects = []
for (const [name, t] of Object.entries(templates)) {
  writeFileSync(new URL(`./${name}.html`, import.meta.url), layout(t))
  subjects.push(`${name}: ${t.subject}`)
}
writeFileSync(new URL('./subjects.txt', import.meta.url), subjects.join('\n') + '\n')
console.log(subjects.join('\n'))
