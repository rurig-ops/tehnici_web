const express= require("express");
const path= require("path");
const fs=require("fs");
const sass=require("sass");
const sharp=require("sharp");

app= express();
app.set("view engine", "ejs")

// const pg = require("pg");




obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"Resurse/scss"),
    folderCss: path.join(__dirname,"Resurse/CSS"),
    folderBackup: path.join(__dirname,"backup"),
}

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

// client=new pg.Client({
//     database:"proiect-tw",
//     user:"maria",
//     password:"1907",
//     host:"localhost",
//     port:5432
// })

// client.connect()

// client.query("select * from prajituri where id>3", function(err, rez){
//     if (err){
//         console.log("Eroare", err)
//     }
//     else{
//         console.log(rez)
//     }
// })

let vect_foldere=[ "temp", "logs", "backup", "fisiere_uploadate" ]
for (let folder of vect_foldere){
    let caleFolder=path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), {recursive:true});   
    }
}

app.use("/Resurse",express.static(path.join(__dirname, "Resurse")));
app.use("/dist",express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname,"Resurse/Imagini/ico/favicon.ico"))
});

app.get(["/", "/index", "/home"], function(req, res){
    res.render("pagini/index",{
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini
    });

});

app.get("/galerie", function(req, res){
    res.render("pagini/galerie-stat",{
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini
    });

});

// //si aici posibil sa trebuiasca editat codu
// app.get("/produse", function(req, res){
//     clauzaWhere=""
//         if (req.query.tip){
//             clauzaWhere=` where tip='${req.query.tip}'`
//         }
//     client.query(`select * from prajituri ${clauzaWhere}`, function(err, rez){
//     if (err){
//         console.log("Eroare", err)
//         afisareEroare(res,2)
//     }
//     else{
//         console.log(rez)
//         res.render("pagini/produse",{
//             produse: rez.rows,
//             optiuni:[]
//         })
//     }
// })
//     });

// //de reparat icia
//     app.get("/produs/:id", function(req, res){
//     client.query(`select * from prajituri where id=${req.params.id}`, function(err, rez){
//     if (err){
//         console.log("Eroare", err)
//         afisareEroare(res,404)
//     }
//     else if{

//     }
//     else{
//         console.log(rez)
//         res.render("pagini/produs",{
//             produse: rez.rows[0],
//         })
//     }
// })
//     });



function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"Resurse/json/erori.json")).toString("utf-8");
    let erori=obGlobal.obErori=JSON.parse(continut)
    let err_default=erori.eroare_default
    err_default.imagine=path.join(erori.cale_baza, err_default.imagine)
    for (let eroare of erori.info_erori){
        eroare.imagine=path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()


function afisareEroare(res, identificator, titlu, text, imagine){
    //TO DO cautam eroarea dupa identificator
    let eroare=obGlobal.obErori.info_erori.find((elem)=>
        elem.identificator==identificator
    
    )
    //daca sunt setate titlu, text, imagine, le folosim, 
    //altfel folosim cele din fisierul json pentru eroarea gasita
    //daca nu o gasim, afisam eroarea default
     let errDefault=obGlobal.obErori.eroare_default;
    if(eroare?.status){
        res.status(eroare.identificator);
    }
    res.render("pagini/eroare",{
        imagine: imagine||eroare?.imagine||errDefault.imagine,
        titlu: titlu||eroare?.titlu||errDefault.titlu,
        text: text||eroare?.text||errDefault.text
    });
}

function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname,"Resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;
    let caleGalerie=obGlobal.obImagini.cale_galerie

    let caleAbs=path.join(__dirname,caleGalerie);
    let caleAbsMediu=path.join(caleAbs, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    
    for (let imag of vImagini){
        [numeFis, ext]=imag.fisier_imagine.split("."); //"ceva.png" -> ["ceva", "png"]
        let caleFisAbs=path.join(caleAbs,imag.fisier_imagine);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", caleGalerie, "mediu", numeFis+".webp" )
        imag.fisier=path.join("/", caleGalerie, imag.fisier_imagine )
        
    }
    // console.log(obGlobal.obImagini)
}
initImagini();

//bonus etapa 4
function checkFiles() {
    //nu exis erori.json
  let caleErori = path.join(__dirname, "Resurse/json/erori.json");
  if (!fs.existsSync(caleErori)) {
    console.error(
      "CRITICAL: Fisierul 'Resurse/json/erori.json' lipseste. Creati fisierul inainte de a reporni serverul.",
    );
    process.exit(1);
  }

  //nu apare una din propr
  let continut = fs.readFileSync(caleErori).toString("utf-8");
  let erori = JSON.parse(continut);

  if (erori.info_erori == undefined) {
    console.error(
      "INFO: Proprietatea 'info_erori' lipseste din 'Resurse/json/erori.json'.\n" +
        '  → Adaugati: "info_erori": [{ "identificator": "...", "status": "...", "titlu": "...", "text:": "...", "imagine": "..."}]',
    );
  }

  if (erori.cale_baza == undefined) {
    console.error(
      "INFO: Proprietatea 'cale_baza' lipseste din 'Resurse/json/erori.json'.\n" +
        '  → Adaugati: "cale_baza": "Resurse/imagini/erori"',
    );
  }

  //eroarea default n are toate propr
  if (erori.eroare_default == undefined) {
    console.error(
      "INFO: Proprietatea 'eroare_default' lipseste din 'Resurse/json/erori.json'.\n" +
        '  → Adaugati: "eroare_default": { "titlu": "...", "text": "...", "imagine": "..." }',
    );
  } else {
    if (erori.eroare_default.titlu == undefined) {
      console.error(
        "INFO: Proprietatea 'eroare_default.titlu' lipseste din 'Resurse/json/erori.json'.\n" +
          '  → Adaugati: "titlu": "A aparut o eroare"',
      );
    }
    if (erori.eroare_default.text == undefined) {
      console.error(
        "INFO: Proprietatea 'eroare_default.text' lipseste din 'Resurse/json/erori.json'.\n" +
          '  → Adaugati: "text": "A aparut o eroare neasteptata. Va rugam reincercati."',
      );
    }
    if (erori.eroare_default.imagine == undefined) {
      console.error(
        "INFO: Proprietatea 'eroare_default.imagine' lipseste din 'Resurse/json/erori.json'.\n" +
          '  → Adaugati: "imagine": "eroare_default.png"',
      );
    }
  }

  //nu exista folderu care e in caleBaza
  let cale_baza = path.join(__dirname, erori.cale_baza);
  if (!fs.existsSync(cale_baza)) {
    console.error(
      `INFO: Directorul '${erori.cale_baza}' specificat in 'Resurse/json/erori.json' nu exista.\n` +
        `  → Creati directorul '${erori.cale_baza}' sau corectati valoarea proprietatii 'cale_baza'.`,
    );
  }

  //nu exista imaginile din info_erori
  for (let eroare of erori.info_erori) {
    let caleImagine = path.join(cale_baza, eroare.imagine);
    if (!fs.existsSync(caleImagine)) {
      console.error(
        `INFO: Imaginea '${eroare.imagine}' pentru eroarea '${eroare.identificator}' nu a fost gasita.\n` +
          `  → Adaugati imaginea in '${erori.cale_baza}' sau corectati valoarea 'imagine' in 'Resurse/json/erori.json'.`,
      );
    }
  }

  //sa nu fie duplicate la ident erorilor
  let grupe = {};
  for (let eroare of erori.info_erori) {
    let id = eroare.identificator;
    if (!grupe[id]) {
      grupe[id] = [];
    }
    grupe[id].push(eroare);
  }

  for (let id in grupe) {
    if (grupe[id].length > 1) {
      console.error(
        `INFO: Identificatorul '${id}' apare de ${grupe[id].length} ori in 'info_erori' din 'Resurse/json/erori.json'.\n` +
          `  → Pastrati doar o singura intrare cu identificatorul '${id}'.`,
      );
      for (let eroare of grupe[id]) {
        let { identificator, ...restProprietati } = eroare;
        console.error(`  → `, restProprietati);
      }
    }
  }
}



function compileazaScss(caleScss, caleCss){
    if(!caleCss){

        let numeFisExt=path.basename(caleScss); // "folder1/folder2/a.scss" -> "a.scss"
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css"; // output: a.css
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    
    let caleBackup=path.join(obGlobal.folderBackup, "Resurse/CSS");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }
    
    // la acest punct avem cai absolute in caleScss si  caleCss

    let numeFisCss=path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "Resurse/CSS",numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    
}

//compilare automata scss facuta de la curs

//la pornirea serverului
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})



app.get("/*pagina", function(req, res){
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/Resurse") && path.extname(req.url)==""){
        afisareEroare(res,403);
        return;
    }
    if (path.extname(req.url)==".ejs"){
        afisareEroare(res,400);
        return;
    }
    try{
        res.render("pagini"+req.url, function(err, rezRandare){
            if (err){
                if (err.message.includes("Failed to lookup view")){
                    afisareEroare(res,404)
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
                res.send(rezRandare);
                console.log("Rezultat randare", rezRandare);
            }
        });
    }
    catch(err){
        if (err.message.includes("Cannot find module")){
            afisareEroare(res,404)
        }
        else{
            afisareEroare(res);
        }
    }
});


app.listen(8080);
console.log("Serverul a pornit!");