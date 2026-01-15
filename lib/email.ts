import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD

console.log("Initializing Email Transporter with user:", GMAIL_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER, 
    pass: GMAIL_PASS, 
  },
  logger: true,
  debug: true,
});

export async function sendAcceptanceEmail({
  to,
  requesterName,
  acceptorName,
  acceptorPhone,
  requestDetails
}: {
  to: string;
  requesterName: string;
  acceptorName: string;
  acceptorPhone: string;
  requestDetails: {
    orderType: string;
    hostel: string;
    gate: string;
    price: number;
    requestId: string;
  };
}) {
  const { orderType, hostel, gate, price } = requestDetails;
  
  try {
    console.log(`Attempting to send email via Gmail...`);
    console.log(`To: ${to}`);

    // Verify connection configuration
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          console.error("SMTP Connection Error:", error);
          reject(error);
        } else {
          console.log("SMTP Server is ready to take our messages");
          resolve(success);
        }
      });
    });
    const info = await transporter.sendMail({
      from: `"JIIT Parcels" <${GMAIL_USER}>`, 
      to: to, 
      subject: 'Your pickup request was accepted!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Request Accepted!</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Someone is picking up your ${orderType}</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <div style="background: white; padding: 20px; border-left: 4px solid #10b981; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px; color: #059669; font-size: 18px;">ACCEPTOR DETAILS</h2>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${acceptorName}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${acceptorPhone}">${acceptorPhone}</a></p>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 16px;">REQUEST SUMMARY</h3>
              <p style="margin: 5px 0;"><strong>Item:</strong> ${orderType}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${hostel} • Gate ${gate}</p>
              <p style="margin: 5px 0;"><strong>Fee:</strong> ₹${price}</p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">Sent via JIIT Parcels App (Gmail SMTP)</p>
          </div>
        </body>
        </html>
      `
    });

    console.log("EMAIL SENT SUCCESSFULLY. ID: %s", info.messageId);
    return info;

  } catch (err) {
    console.error("Send Mail Failed:", err);
    return null;
  }
}