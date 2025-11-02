import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imagekit from "../configs/imagekit.js";
import ai from "../configs/gemini.js";

// 💬 TEXT MESSAGE CONTROLLER
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🪙 Check user credits
    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature.",
      });
    }

    const { chatId, prompt } = req.body;

    // 🧠 Find chat by ID
    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return res.json({ success: false, message: "Chat not found." });
    }

    // 💬 Save user prompt
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // 🧠 Initialize Gemini model
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 🔥 Generate response
    const result = await model.generateContent(prompt);
    const replyText = result.response.text();

    // 💬 Create assistant reply object
    const reply = {
      role: "assistant",
      content: replyText,
      timestamp: Date.now(),
      isImage: false,
    };

    // Send response to frontend
    res.json({ success: true, reply });

    // Save assistant reply + deduct credits
    chat.messages.push(reply);
    await chat.save();
    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });

  } catch (error) {
    console.error("Gemini Text Message Error:", error);
    res.json({
      success: false,
      message: error.message || "Failed to generate response.",
    });
  }
};

// 🖼️ IMAGE MESSAGE CONTROLLER
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🪙 Check credits
    if (req.user.credits < 2) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature.",
      });
    }

    const { prompt, chatId, isPublished } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return res.json({ success: false, message: "Chat not found." });
    }

    // 🧑‍💬 Save user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // ⚙️ Encode prompt and construct ImageKit URL
    const encodedPrompt = encodeURIComponent(prompt);
    const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/hiragpt/${Date.now()}.png?tr=w-800,h-800`;

    // 🚀 Fetch generated image
    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
    });

    // Convert to base64 and upload to ImageKit
    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "hiragpt",
    });

    // 💬 Create assistant reply object
    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished,
    };

    res.json({ success: true, reply });

    // Save assistant reply + deduct credits
    chat.messages.push(reply);
    await chat.save();
    await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });

  } catch (error) {
    console.error("Image Message Error:", error);
    res.json({
      success: false,
      message: error.message || "Failed to generate image.",
    });
  }
};
