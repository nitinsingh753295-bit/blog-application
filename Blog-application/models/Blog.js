const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 180
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        content: {
            type: String,
            required: true,
            maxlength: 50000
        },

        image: {
            type: String,
            default: "",
            trim: true
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);