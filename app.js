const puppeteer = require("puppeteer");
const fs = require("fs");
const {Parser} = require ("json2csv")
const  XLSX = require ("xlsx") 

async function obtenerDatosAngularBlog() {
    const navegador = await puppeteer.launch({
        headless: false,
        slowMo: 1000,
    });

    const pagina = await navegador.newPage();

    await pagina.goto("https://blog.angular.dev/");

    const datos = await pagina.evaluate(() => {
        const resultados = [];
        document
            .querySelectorAll("main>div:first-child>div:nth-child(2)>div>div.o.q")
            .forEach((elemento) => {
                const imagen = elemento.querySelector("img").src;
                const autor = elemento.querySelector("div>a>p").innerText;

                const titulo = elemento.querySelector("div>a>h2").innerText;
                const texto = elemento.querySelector("div>a>div>h3").innerText;
                const fecha = elemento.querySelector("div>span>div>div").innerText;
                const fechaModificada = fecha.split(`\n`);
                const data = {
                    articulo: {
                        titulo,
                        texto,
                        autor: {
                            nombre: autor,
                            avatar: imagen,
                        },
                        fecha: fechaModificada[0],
                        reacciones: {
                            likes: fechaModificada[1],
                            comentarios: fechaModificada[2],
                        },
                    },
                };

                resultados.push(data);
            });
        return resultados;
    });

    // Crear archivo JSON
    let jsonData = JSON.stringify(datos);
    fs.writeFileSync("datosJSON.json", jsonData, "utf-8");

    //Crear archivo CSV
    const fields = ["titulo", "texto", "autor.nombre", "autor.avatar", "fecha", "reacciones.likes", "reacciones.comentarios"];
    const json2csvParse = new Parser({
        fields,
        defaultValue: "No hay Información",
    });
    const csv = json2csvParse.parse(datos.map(item => item.articulo));
    fs.writeFileSync("datosCSV.csv", csv, "utf-8");

    //Crear archivo XLSX
    const data = datos.map(item => {
        return {
            Titulo: item.articulo.titulo,
            Texto: item.articulo.texto,
            Autor: item.articulo.autor.nombre,
            Avatar: item.articulo.autor.avatar,
            Fecha: item.articulo.fecha,
            Likes: item.articulo.reacciones.likes,
            Comentarios: item.articulo.reacciones.comentarios
        };
    })

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos del blog");
    XLSX.writeFile(workbook, "datosXLSX.xlsx");

    navegador.close();
}

obtenerDatosAngularBlog();
