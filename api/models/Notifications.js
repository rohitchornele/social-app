import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
	{
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		type: {
			type: String,
			enum: ["like", "comment", "follow", "mention"],
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		relatedPost: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			default: null,
		},
		relatedComment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
			default: null,
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		isEmailSent: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);
