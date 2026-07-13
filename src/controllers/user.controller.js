import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import multer from "multer"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

export {registerUser}



