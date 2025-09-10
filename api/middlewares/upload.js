import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	// Check if file is an image
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Only image files are allowed"), false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});

export const uploadSingle = upload.single("image");

export const handleMulterError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({
				success: false,
				message: "File size too large. Maximum size is 5MB",
			});
		}
	}

	if (err.message === "Only image files are allowed") {
		return res.status(400).json({
			success: false,
			message: "Only image files are allowed",
		});
	}

	next(err);
};
