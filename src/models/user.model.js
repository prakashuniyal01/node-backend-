import mongoose, {Schema} from "mongoose";

const userSchema = new Schema(
    {
        username :{
            type : String,
            require: true,
            unique: true,
            lowecase: true,
            trim: true,
            index: true
        },
        email:{
            type : String,
            require: true,
            unique: true,
            lowecase: true,
            trim: true,
        },
        fullname :{
            type : String,
            require: true,
            lowecase: true,
            trim: true,
            index: true
        },
        avatar :{
            type : String,// cloudnary url
            require : true

        },
        coverImage :{
            type : String,
        },
        watchHistory:[
            {
                type : Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            require: [true, "password is required"]
        },
        refreshTocken: {
            type: String
        }
    },{
        timestamps: true
    }
)



export const User = mongoose.model("User", userSchema )