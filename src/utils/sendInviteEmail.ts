import emailjs from "@emailjs/browser";

// Initialize EmailJS with your public key
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_nayance";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_nayance";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

// Initialize EmailJS only once
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

export const sendInviteEmail = async (
  email: string,
  inviteId: string,
  role: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!EMAILJS_PUBLIC_KEY) {
      console.warn("EmailJS not configured. Please set REACT_APP_EMAILJS_PUBLIC_KEY in .env");
      return {
        success: true,
        message: `Invite created (email not configured)`
      };
    }

    const inviteLink = `${window.location.origin}/accept-invite/${inviteId}`;

    const templateParams = {
      to_email: email,
      role: role,
      invite_link: inviteLink,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      return {
        success: true,
        message: `Invite sent to ${email}`
      };
    }

    return {
      success: false,
      message: "Failed to send email"
    };
  } catch (error: any) {
    console.error("EmailJS Error:", error);
    return {
      success: false,
      message: error.message || "Failed to send invite email"
    };
  }
};


