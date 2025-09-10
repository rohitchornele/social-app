

export const register = async (req, res, next) => {
    try {
    console.log("This is a test route, App is connected to backend")
    } catch (error) {
        next(error);
    }
};