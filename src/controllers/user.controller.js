import { asyncHandler } from "../utils/asyncHandler.util.js";
import { User } from "../models/user.model.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating referesh and access token"
        );
    }
};

export const registerUser = asyncHandler(async (req, res) => {
    // 1. get user details from fontend
    const { fullName, username, email, password } = req.body;
    // 2. validation - not empty
    if (
        [fullName, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "all fields are required..");
    }
    // 3. check if user already exists: username, email
    const existUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existUser) {
        throw new ApiError(409, "username or email already exist..");
    }
    // 4. check for images, check for avater
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // 5. upload them to cloudinary
    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log(avatar, coverImage);
    // return res.json({ message: "ok" });
    // 6. create user object - create entry in db
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatarLocalPath || "",
        coverImage: coverImageLocalPath || "",
    });
    // 7. remove password and refresh token
    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // 8. check for user creation
    if (!createUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user..."
        );
    }
    // 9. return res
    return res
        .status(201)
        .json(
            new ApiResponse(200, createUser, "User registered successfully...")
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username) {
        throw new ApiError(400, "username or email is required...");
    }

    const user = await User.findOne({
        $or: [{ username }, { email: username }],
    });

    if (!user) {
        throw new ApiError(404, "user does't exist...");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(404, "Invalid user credentials...");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        user._id
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    _id: user._id,
                    accessToken,
                    refreshToken,
                },
                "User logged In successfully..."
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: null } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out successfully..."));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incommingRefershToken =
            req.cookies.refreshToken || req.body.refreshToken;
        if (!incommingRefershToken) {
            throw new ApiError(401, "Unauthorized request");
        }
        const decodedToken = jwt.verify(
            incommingRefershToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incommingRefershToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefereshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token is refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});
