import User from "../models/user.model.js";

async function login(req, res) {
    try {
        const { mobile, password } = req.body;
    
        if(mobile == null || password == null) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        
        const user = await User.findOne({ mobile }); 
        
        if(!user) {
            return res.status(401).json({
                success: false,
                message: "User does not exist"
            })
        }

        const isPasswordCorrect = user.password === password

        if(!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid user credentials"
            })
        }

        const loggedInUser = await User.findById(user._id).select("-password");
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: loggedInUser
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error
        })
    }
}

async function signUp(req, res) {
    try {
        const { username, mobile, password } = req.body;
    
        if(!username || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const isRegistered = await User.findOne({ mobile });
        if (isRegistered) {
            return res.status(401).json({
                success: false,
                message: "User already exists"
            });
        }

        const user = await User.create({
            username,
            mobile,
            password
        });

        return res.status(200).json({
            success: true,
            message: "User registered successfully",
            data: user
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error
        });
    }
}

export {
    login,
    signUp
}