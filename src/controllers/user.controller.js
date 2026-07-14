import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import multer from "multer"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccesstokenAndRefreshtoken= async(userId)=>{
    try {
        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken= refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {        
        throw new ApiError(500, "something went wrong while generating tokens")
    }

}

const registerUser= asyncHandler(async(req, res)=>{

    const {fullname, username, email, password}= req.body


    if(
        [fullname, username,email, password].some((fields)=>{
            return fields?.trim()===""})
    ){
        throw new ApiError(400, "fullname is required")
    }


    const existedUser= await User.findOne({
        $or:[{email}, {username}]
    })
    if(existedUser){
        throw new ApiError(409, "this username or email already exists")
    }

const avatarLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar image needed")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "cloudinary upload failed")
    }

    const user= await User.create({
        fullname,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        password
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
})



const loginUser= asyncHandler(async(req, res)=>{
    const{username, password, email}= req.body

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user= await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "user not found")
    }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "password incorrect")
    }

    const {accessToken, refreshToken}= await generateAccesstokenAndRefreshtoken(user._id)

    const loggedinUser= await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedinUser , accessToken , refreshToken
            },
            "user loggedin successfully"
        )
    )
})

const logoutUser= asyncHandler(async(req, res)=>{
    User.findByIdAndUpdate(
        req.user._id,(
            {
                $set:{
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )
    )
    const options={
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"))
})


const refreshAccessToken= asyncHandler(async(req, res)=>{
    try {
        const incomingTOken= req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomingTOken){
            throw new ApiError(401, "unauthorized request")
        }
    
        const decodedToken= jwt.verify(incomingTOken, process.env.REFRESH_TOKEN_SECRET)
        const user= await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "invalid refresh token")
        }
    
        if(incomingTOken!==user?.refreshToken){
            throw new ApiError(401, "invalid or expired refresh token")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken}= await generateAccesstokenAndRefreshtoken(user._id)
    
        return res
        .status(201)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
            200, 
            {accessToken, 
            refreshToken: newRefreshToken
            }, 
            "accessToken refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}



