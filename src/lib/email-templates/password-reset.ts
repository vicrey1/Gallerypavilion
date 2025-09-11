import { createTransporter } from '@/lib/email'

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const transporter = await createTransporter()
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #7c3aed;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 0.9em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h2>Reset Your Password</h2>
      <p>You recently requested to reset your password for your Gallery Pavilion account. Click the button below to reset it.</p>
      <p><a href="${resetUrl}" class="button">Reset Your Password</a></p>
      <p>If you did not request a password reset, please ignore this email or contact us if you have concerns.</p>
      <p>This password reset link is only valid for 1 hour.</p>
      <div class="footer">
        <p>Gallery Pavilion</p>
        <p>This email was sent to ${email}.</p>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Gallery Pavilion" <noreply@gallerypavilion.com>',
    to: email,
    subject: 'Reset Your Gallery Pavilion Password',
    html
  })
}
