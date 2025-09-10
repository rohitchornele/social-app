import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		imageUrl: {
			type: String,
			required: [true, "Image is required"],
		},
		imagePublicId: {
			type: String,
			required: true,
		},
		caption: {
			type: String,
			maxlength: [2200, "Caption cannot exceed 2200 characters"],
			default: "",
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
		commentCount: {
			type: Number,
			default: 0,
		},
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
postSchema.pre("save", function (next) {
	this.likeCount = this.likes.length;
	next();
});

export default mongoose.model("Post", postSchema);
