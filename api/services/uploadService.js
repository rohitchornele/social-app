import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

export const uploadImageToCloudinary = async (
	buffer,
	folder = "community-app",
) => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				resource_type: "image",
				transformation: [
					{ width: 800, height: 800, crop: "limit" },
					{ quality: "auto" },
					{ fetch_format: "auto" },
				],
			},
			(error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			},
		);

		const stream = Readable.from(buffer);
		stream.pipe(uploadStream);
	});
};

export const deleteImageFromCloudinary = async (publicId) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result;
	} catch (error) {
		console.error("Error deleting image from Cloudinary:", error);
		throw error;
	}
};
