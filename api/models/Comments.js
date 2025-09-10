import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
	{
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: {
			type: String,
			required: [true, "Comment text is required"],
			maxlength: [500, "Comment cannot exceed 500 characters"],
			trim: true,
		},
		likes: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		likeCount: {
			type: Number,
			default: 0,
		},
		parentComment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
			default: null,
		},
		replies: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

// Update like count when likes array changes
commentSchema.pre("save", function (next) {
	this.likeCount = this.likes.length;
	next();
});

export default mongoose.model("Comment", commentSchema);
