const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  phone: {
    type: Number,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  fullName: {
    type: String
  },
  gender: {
    type: Boolean
  },
  address: {
    type: String
  },
  birthday: {
    type: Date
  },
  avatar: {
    type: String
  },
  createdTime: {
    type: Number
  },
  timestamp: {
    type: Number
  },
  userAgent: {
    type: String
  }
});

mongoose.model("User", userSchema);
