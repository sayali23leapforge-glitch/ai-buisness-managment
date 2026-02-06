import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

export const sendInvite = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email address" };
    }

    // Send password reset email (acts as invitation)
    await sendPasswordResetEmail(auth, email);
    
    return { 
      success: true, 
      message: `Invite sent to ${email}` 
    };
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error.code === "auth/user-not-found") {
      return { 
        success: false, 
        message: "User not found. They may need to sign up first." 
      };
    }
    
    return { 
      success: false, 
      message: error.message || "Failed to send invite" 
    };
  }
};
