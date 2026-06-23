const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const seed = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB.");

        const usersCount = await User.countDocuments();
        console.log(`Current user count: ${usersCount}`);

        if (usersCount > 0) {
            console.log("Updating passwords of existing users to known values...");

            const adminUser = await User.findOne({ username: "admin" });
            if (adminUser) {
                adminUser.password = "admin123";
                await adminUser.save();
                console.log("Updated admin password to admin123");
            }

            const teacherUser = await User.findOne({ username: "joel" });
            if (teacherUser) {
                teacherUser.password = "joel123";
                await teacherUser.save();
                console.log("Updated teacher 'joel' password to joel123");
            }

            const studentUser = await User.findOne({ username: "precious" });
            if (studentUser) {
                studentUser.password = "precious123";
                await studentUser.save();
                console.log("Updated student 'precious' password to precious123");
            }
        }

        mongoose.connection.close();
        console.log("Done.");
    } catch (err) {
        console.error("Error running seed script:", err);
    }
};

seed();
