import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export const sendEmail = async ({ to, subject, html, text }) => {
	try {
		const mailOptions = {
			from: process.env.EMAIL_FROM,
			to,
			subject,
			html,
			text,
		};

		const result = await transporter.sendMail(mailOptions);
		console.log("Email sent successfully:", result.messageId);
		return result;
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error("Failed to send email");
	}
};

export const sendNotificationEmail = async (user, type, data = {}) => {
	const emailTemplates = {
		like: {
			subject: "Someone liked your post!",
			html: `
        <h2>Good news!</h2>
        <p><strong>${data.senderName}</strong> liked your post.</p>
        <p>Check it out in the app!</p>
      `,
		},
		comment: {
			subject: "New comment on your post",
			html: `
        <h2>New Comment!</h2>
        <p><strong>${data.senderName}</strong> commented on your post:</p>
        <blockquote style="background: #f5f5f5; padding: 10px; border-left: 4px solid #007bff;">
          "${data.commentText}"
        </blockquote>
        <p>Reply in the app!</p>
      `,
		},
		follow: {
			subject: "You have a new follower!",
			html: `
        <h2>New Follower!</h2>
        <p><strong>${data.senderName}</strong> started following you.</p>
        <p>Check out their profile in the app!</p>
      `,
		},
	};

	const template = emailTemplates[type];
	if (!template) {
		throw new Error("Invalid email template type");
	}

	await sendEmail({
		to: user.email,
		subject: template.subject,
		html: template.html,
		text: template.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
	});
};
