import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
			trim: true,
			minlength: [3, "Username must be at least 3 characters"],
			maxlength: [20, "Username cannot exceed 20 characters"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please enter a valid email",
			],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false,
		},
		profilePicture: {
			type: String,
			default: null,
		},
		bio: {
			type: String,
			maxlength: [150, "Bio cannot exceed 150 characters"],
			default: "",
		},
		followers: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}],
		following: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}],
		// Add counts for better performance
		followerCount: {
			type: Number,
			default: 0
		},
		followingCount: {
			type: Number,
			default: 0
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		refreshToken: {
			type: String,
			select: false,
		},
	},
	{
		timestamps: true,
	},
);

// Update counts when followers/following arrays change
userSchema.pre('save', function(next) {
  this.followerCount = this.followers.length;
  this.followingCount = this.following.length;
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
	const userObject = this.toObject();
	delete userObject.password;
	delete userObject.refreshToken;
	return userObject;
};

export default mongoose.model("User", userSchema);
