const express= require("express");
const path= require("path");

app= express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.set("views", path.join(__dirname, "views"));
app.get("/", (req, res) => {
    res.render("pagini/index");
});

app.use(express.static(path.join(__dirname, "Resurse")));


app.listen(8080);
console.log("Serverul a pornit!");