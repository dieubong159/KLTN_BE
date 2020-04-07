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

userSchema.pre("save", function(next) {
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

userSchema.methods.comparePassword = function(candidatePassword) {
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
