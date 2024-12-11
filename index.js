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
    host:
      process.env.RDS_HOSTNAME ||
      "awseb-e-2pm9wxdypv-stack-awsebrdsdatabase-p0uhggqyvn0y.chiykskmafi4.us-east-1.rds.amazonaws.com",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "gocougs123",
    database: process.env.RDS_DB_NAME || "ebdb",
    port: process.env.RDS_PORT || 5432,
    ssl: { rejectUnauthorized: false }, // Adjust SSL as needed
  },
  pool: {
    min: 0,
    max: 15,
    acquireTimeoutMillis: 30000,
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

// FAQ Get Route
app.get("/faqs", (req, res) => {
  res.render("faq", {
    title: "FAQs",
    errorMessage: null
  });
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await knex("users").where({ username }).first();
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