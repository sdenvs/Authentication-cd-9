const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
app.use(express.json());

let dbPath = path.join(__dirname, "userData.db");

let db = null;

const initialisation = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`error: ${e}`);
  }
};

initialisation();

//api-1 register

app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const isUserPresentQuery = `SELECT *
        FROM 
            user 
        WHERE 
            username =  '${username}';`;
  const isUserPresent = await db.get(isUserPresentQuery);
  console.log(isUserPresent);
  if (isUserPresent === undefined) {
    let passLength = password.length;

    if (passLength > 4) {
      const hashPass = await bcrypt.hash(password, 10);
      console.log(hashPass);
      const registerQuery = `INSERT INTO user
            (username, name, password, gender, location)
            VALUES
            ('${username}', '${name}', '${hashPass}', '${gender}', '${location}');`;

      await db.run(registerQuery);
      res.send("User created successfully");
    } else {
      res.status(400);
      res.send("Password is too short");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});
//api-2 login

app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const isUserPresentQuery = `SELECT *
        FROM 
            user 
        WHERE 
            username =  '${username}';`;
  const isUserPresent = await db.get(isUserPresentQuery);
  if (isUserPresent === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const matchPass = await bcrypt.compare(password, isUserPresent.password);
    if (matchPass) {
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

//api-3 change pass
app.put("/change-password/", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const isUserPresentQuery = `SELECT *
        FROM 
            user 
        WHERE 
            username =  '${username}';`;
  const isUserPresent = await db.get(isUserPresentQuery);
  if (isUserPresent === undefined) {
    res.status(400);
    res.send("user not found");
  } else {
    const isPassMatch = await bcrypt.compare(
      oldPassword,
      isUserPresent.password
    );
    if (isPassMatch) {
      const newPassLength = newPassword.length;
      if (newPassLength > 4) {
        const hashNewPass = await bcrypt.hash(newPassword, 10);
        const changePassQuery = `UPDATE user 
                    SET 
                    password = '${hashNewPass}'
                    WHERE 
                    username = '${username}';`;
        await db.run(changePassQuery);
        res.send("Password updated");
      } else {
        res.status(400);
        res.send("Password is too short");
      }
    } else {
      res.status(400);
      res.send("Invalid current password");
    }
  }
});

module.exports = app;
