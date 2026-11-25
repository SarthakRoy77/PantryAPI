//Verify Token logic
const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);

        next();
    } catch (error) {
        return res.status(401).json({ message: `Error in Middleware /verifyToken: ${error.message}` });
    }
};