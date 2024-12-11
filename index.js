let express = require("express");
let app = express();
let path = require("path");

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

//This is where the connection goes 

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "gocougs123",
    database: process.env.RDS_DB_NAME || "ebdb",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});



// test database connection
knex
  .raw("SELECT 1")
  .then(() => console.log("Database connection successful!"))
  .catch((err) => console.error("Database connection failed:", err));

app.get("/", (req, res) => {
  res.render("index");
});


app.get("/login", (req, res) => {
  res.render("login", {
    title: "Admin Login",
    errorMessage: null
  });
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await knex("admins").where({ username }).first();
    if (admin && admin.password === password) {
      // Successful login
      console.log('Success')
      res.redirect("/");
    } else {
      // Invalid credentials
      res.render("login", {
        title: "Admin Login",
        errorMessage: "Invalid username or password."
      });
    }
  } catch (error) {
    // Log the error and show a generic message
    console.error("Error during login:", error);
    res.status(500).render("login", {
      title: "Admin Login",
      errorMessage: "An error occurred. Please try again later."
    });
  }
});










app.listen(port, () => console.log(`Server is listening!`));