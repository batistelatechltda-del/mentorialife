const emailTemplateForReminder = ({
  username,
  title,
  description,

}) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; font-family: sans-serif;">
    <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <table align="center" width="600" bgcolor="#ffffff" cellpadding="0" cellspacing="0" style="margin: auto;">
            <tr>
              <td style="padding: 20px;">
                <h2 style="margin: 0; color: #333333;">Dear ${username || "User"
    },</h2>
                <p style="color: #555555; line-height: 1.5;">
                  ${description}
                </p>
                
    
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; color: #777777; font-size: 12px; text-align: center;">
                Thank you for using our service.<br/>MentorAi Team
              </td>
            </tr>
          </table>
          <table align="center" width="600" cellpadding="0" cellspacing="0" style="margin: auto; text-align: center; padding: 20px 0;">
            <tr>
              <td style="color: #999999; font-size: 12px;">
                © MentorAi All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

module.exports = { emailTemplateForReminder };
