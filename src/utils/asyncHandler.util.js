const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        return Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            // next(err)
            res.status(err.statusCode).json({
                success: false,
                url: req.originalUrl,
                message: err.message,
            })
        );
    };
};

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.status).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

export { asyncHandler };
