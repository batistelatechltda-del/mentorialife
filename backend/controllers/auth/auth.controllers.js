// const { pusher } = require("../../configs/pusher");
const { createAndSendEmail } = require("../../configs/email");
const { prisma } = require("../../configs/prisma");
const responses = require("../../constants/responses");
// const redis = require("../../configs/redis");
const {
  badRequestResponse,
  createSuccessResponse,
  okResponse,
  updateSuccessResponse,
  unauthorizedResponse,
} = require("../../constants/responses");
const {
  sendEmailVerificationOtp,
  sendResendPassword,
} = require("../../email/email-verification");
const {
  Email_Template_Reminder,
} = require("../../email/forgetPasswordTemplete");
const {
  hashPassword,
  comparePasswords,
  createToken,
  createOtpToken,
  generateOTP,
} = require("../../services/auth.service");
const { unixTimeInMinutes } = require("../../services/time.service");
const {
  deleteCloudinaryImage,
  uploadImageFromBuffer,
} = require("../../middlewares/uploadPicture.middleware");

const emailVerification = process.env.EMAIL_VERIFICATION;

const register = async (req, res, next) => {
  try {
    const { password, email, ...data } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const response = unauthorizedResponse("Email already taken.");
      return res.status(response.status.code).json(response);
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();

    const verification = await prisma.verification.create({
      data: {
        ...data,
        email,
        password: hashedPassword,
        authentication: {
          create: {
            email_otp: otp,
            is_email_verified: false,
          },
        },
      },
      include: {
        authentication: true,
      },
    });

    await sendEmailVerificationOtp(email, otp);

    const verificationToken = createOtpToken({
      userId: verification.id,
      type: emailVerification,
    });

    const response = okResponse(
      { token: verificationToken },
      "OTP has been sent to your email."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const setOnlineStatus = async (userId, status) => {
  // pusher.trigger(`user-${userId}`, "user:status", {
  //   status,
  //   userId
  // }),
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { is_online: status }
  // })
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        authentication: true,
      },
    });

    if (!user) {
      return res.status(400).json(badRequestResponse("Invalid credentials."));
    }

    if (user.platform !== null) {
      return res
        .status(400)
        .json(
          badRequestResponse(
            `Account exists with ${user.platform}. Use that method to login.`
          )
        );
    }

    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json(badRequestResponse("Invalid credentials."));
    }

    if (!user.authentication?.is_email_verified) {
      const otp = generateOTP();

      await prisma.authentication.update({
        where: { user_id: user.id },
        data: { email_otp: otp },
      });

      await sendEmailVerificationOtp(user.email, otp);

      const verificationToken = createOtpToken({
        userId: user.id,
        type: emailVerification,
      });

      const token = createToken({ userId: user.id, role: user.type });

      return res.status(200).json(
        createSuccessResponse(
          {
            user,
            token,
            verify_token: verificationToken,
          },
          "OTP has been sent to your email for verification."
        )
      );
    }

    const token = createToken({ userId: user.id, role: user.type });

    return res
      .status(200)
      .json(
        createSuccessResponse(
          { user, token },
          `${user.type} logged in successfully.`
        )
      );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { userId } = req.user;

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
};

const socialLogin = async (req, res, next) => {
  try {
    const { email, social_id, platform, username } = req.body;
    let user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        userProfile: true,
      },
    });

    if (user) {
      let toke_data = { userId: user?.id, role: user?.type };
      const token = createToken(toke_data);
      const data = okResponse(user);
      return res.status(data.status.code).json({ user, token });
    }

    user = await prisma.user.create({
      data: {
        email,
        username,
        social_id,
        platform,
        authentication: {
          create: {
            is_email_verified: true,
          },
        },
      },
      include: {
        userProfile: true,
      },
    });

    let toke_data = { userId: user?.id, role: user?.type };
    const token = createToken(toke_data);
    const data = okResponse(user);
    return res.status(data.status.code).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { previous_password, new_password } = req.body;

    let user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      const response = badRequestResponse("User not found");
      return res.status(response.status.code).json(response);
    }
    const hashedPassword = await hashPassword(new_password);
    const passwordMatch = await comparePasswords(
      previous_password,
      user?.password
    );

    if (!passwordMatch) {
      const response = badRequestResponse("Previous password is invalid");
      return res.status(response.status.code).json(response);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await sendResendPassword(user?.email);

    const response = updateSuccessResponse(
      updatedUser,
      "Password updated successfully."
    );

    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const generateForgetLink = async (req, res, next) => {
  try {
    const { email } = req.body;

    let user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    let toke_data = { userId: user?.id, role: user?.type };
    const token = createToken(toke_data, "5m");

    if (!user) {
      const response = badRequestResponse("User not found");
      return res.status(response.status.code).json(response);
    }

    await createAndSendEmail({
      to: user?.email,
      subject: "Forgot Password",
      html: Email_Template_Reminder(user.id, token),
    });

    const response = createSuccessResponse("email  send successfully.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { userId } = req.user;
  const { new_password } = req.body;

  try {
    const hashedPassword = await hashPassword(new_password);
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });
    const response = updateSuccessResponse(
      updatedUser,
      "Password updated successfully."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const subscription = async (req, res, next) => {
  const { userId } = req.user;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.auth || !keys?.p256dh) {
    return res.status(400).json({ message: "Invalid subscription payload" });
  }

  try {
    const existing = await prisma.push_subscription.findFirst({
      where: {
        user_id: userId,
        endpoint: endpoint,
      },
    });
    if (!existing?.id) {
      await prisma.push_subscription.create({
        data: {
          user_id: userId,
          endpoint,
          auth: keys.auth,
          p256dh: keys.p256dh,
        },
      });
    }

    return res.status(200).json({ message: "Subscription saved" });
  } catch (error) {
    next(error)
  }
};

const generateOtp = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        authentication: {
          select: {
            isEmailVerified: true,
          },
        },
      },
    });

    if (!user) {
      const response = badRequestResponse("Could not find user.");
      return res.status(response.status.code).json(response);
    }

    const otp = generateOTP();

    if (user.authentication.isEmailVerified) {
      const response = badRequestResponse("Email already verified.");
      return res.status(response.status.code).json(response);
    }

    await prisma.authentication.update({
      where: {
        userId: user.id,
      },
      data: {
        emailOtp: otp,
      },
    });

    await sendEmailVerificationOtp(email, otp);

    const verificationToken = createOtpToken({
      userId: user.id,
      type: emailVerification,
    });

    const response = okResponse(
      { token: verificationToken },
      "Otp has been sent on email."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await prisma.verification.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        authentication: {
          select: {
            is_email_verified: true,
          },
        },
      },
    });

    if (!user) {
      const response = badRequestResponse("User not found.");
      return res.status(response.status.code).json(response);
    }

    if (user.authentication.is_email_verified) {
      const response = badRequestResponse("Email already verified.");
      return res.status(response.status.code).json(response);
    }

    const otp = generateOTP();
    await prisma.authentication.update({
      where: {
        verification_id: user.id,
      },
      data: {
        email_otp: otp,
      },
    });

    await sendEmailVerificationOtp(user.email, otp);

    const response = okResponse({}, "OTP has been resent to your email.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  const { otp } = req.body;
  const { userId } = req.user;

  try {
    const auth = await prisma.authentication.findFirst({
      where: { verification_id: userId },
      include: { verification: true },
    });

    if (!auth || !auth.verification) {
      const response = badRequestResponse("Invalid token.");
      return res.status(response.status.code).json(response);
    }

    if (auth.is_email_verified) {
      const response = badRequestResponse("Email already verified.");
      return res.status(response.status.code).json(response);
    }

    const timeDiff =
      unixTimeInMinutes(Date.now()) - unixTimeInMinutes(auth.updated_at);
    if (timeDiff > 15) {
      const response = badRequestResponse("OTP has expired.");
      return res.status(response.status.code).json(response);
    }

    if (auth.email_otp !== otp) {
      const response = badRequestResponse("Invalid OTP.");
      return res.status(response.status.code).json(response);
    }

    const verified = auth.verification;
    const newUser = await prisma.user.create({
      data: {
        email: verified.email,
        password: verified.password,
        type: verified.type,
        social_id: verified.social_id,
        platform: verified.platform,

        authentication: {
          create: {
            is_email_verified: true,
          },
        },
        profile: {
          create: {
            full_name: verified?.full_name,
          },
        },
      },
      include: {
        authentication: true,
      },
    });

    await prisma.authentication.delete({
      where: { id: auth.id },
    });

    await prisma.verification.delete({
      where: { id: verified.id },
    });

    const tokenData = { userId: newUser.id, role: newUser.type };
    const token = createToken(tokenData);

    const response = okResponse(
      { user: newUser, token },
      "Email verified and user created successfully."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const getUserId = async (req, res, next) => {
  try {
    const { userId } = req.user;
    // const cacheKey = `user:${userId}`;

    // const cachedUser = await redis.get(cacheKey);
    // if (cachedUser) {
    //   return res.status(200).json(okResponse(JSON.parse(cachedUser)));
    // }
    //
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        goals: true,
        journals: true,
        reminders: true,
        calendarEvents: true,
      },
    });

    if (!user) {
      return res.status(404).json(badRequestResponse("User not found."));
    }

    // await redis.set(cacheKey, JSON.stringify(user), { EX: 300 });

    const response = okResponse(user);
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const createUpdateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const existingProfile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });

    let result;

    if (existingProfile) {
      result = await prisma.profile.update({
        where: { user_id: userId },
        data: {
          ...req.body,
        },
      });

      return res
        .status(200)
        .json(
          responses.updateSuccessResponse(
            result,
            "Profile updated successfully."
          )
        );
    } else {
      result = await prisma.profile.create({
        data: {
          user_id: userId,
          first_name,
          last_name,
          phone_number,
        },
      });

      return res
        .status(201)
        .json(
          responses.createSuccessResponse(
            result,
            "Profile created successfully."
          )
        );
    }
  } catch (error) {
    return res
      .status(500)
      .json(
        responses.serverErrorResponse(
          "Something went wrong while saving profile."
        )
      );
  }
};

const updateProfile = async (req, res, next) => {
  const { userId } = req.user;
  const { ...data } = req.body;

  try {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      return res.status(404).json(badRequestResponse("Profile not found."));
    }

    const profilePic = req.files?.find(
      (f) => f.fieldname === "profile_picture_url"
    );
    if (profilePic) {
      if (profile.profile_picture_url) {
        await deleteCloudinaryImage(profile.profile_picture_url);
      }
      data.profile_picture_url = await uploadImageFromBuffer(profilePic);
    }

    await prisma.profile.update({
      where: { user_id: userId },
      data: {
        ...data,
      },
      include: {
        user: true,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const cacheKey = `user:${userId}`;
    // await redis.set(cacheKey, JSON.stringify(updatedUser), { EX: 300 });

    return res.status(200).json(updateSuccessResponse(updatedUser));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  verifyOtp,
  generateOtp,
  resendOtp,
  socialLogin,
  resetPassword,
  forgotPassword,
  generateForgetLink,
  getUserId,
  logout,
  createUpdateProfile,
  updateProfile,
  subscription,
};
