const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const randomStr = (len, arr) => {
  var ans = "";
  for (var i = len; i > 0; i--) {
    ans += arr[Math.floor(Math.random() * arr.length)];
  }
  return ans;
};

const userSchema = mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: false,
  },
  fullName: {
    type: String,
  },
  gender: {
    type: Boolean,
  },
  address: {
    type: String,
  },
  birthday: {
    type: Date,
  },
  avatar: {
    type: String,
  },
  createdTime: {
    type: Number,
    default: Date.now(),
  },
  timestamp: {
    type: Number,
    default: Date.now().valueOf(),
  },
  userAgent: {
    type: String,
  },
});

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword) {
  const user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }

      if (!isMatch) {
        return reject(false);
      }

      resolve(true);
    });
  });
};

mongoose.model("User", userSchema);
