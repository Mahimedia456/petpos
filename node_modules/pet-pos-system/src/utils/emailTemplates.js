export function otpEmailTemplate({ otp, appName = "Pet POS Admin" }) {
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:30px;text-align:center;">
                <h1 style="margin:0;font-size:24px;color:#0f172a;">${appName}</h1>
                <p style="margin:10px 0 0;font-size:14px;color:#64748b;">
                  Password reset verification code
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:10px 30px 30px;text-align:center;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">
                  Use this OTP to reset your password.
                </p>

                <div style="display:inline-block;background:#0f172a;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:8px;padding:18px 28px;border-radius:18px;">
                  ${otp}
                </div>

                <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                  This OTP will expire soon. If you did not request it, ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 30px 30px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">
                  © ${new Date().getFullYear()} ${appName}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}