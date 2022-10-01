var express = require('express');
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

var db = require('./db'); //TODO: aislar en un modulo separado de  configuracion general de express

var app = express();
app.use(logger('dev'));
//A: tengo una aplicacion

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({origin:'*'})) //TODO: SEC: restringir
//A: middleware para recibir json, forms, cookies

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//A: configure vistas, plantillas y public si quiero atender la vista, sino sacar

app.use('', async function(req, res, next) {
	console.log("REQ path", req.path);

	const data= await db.transaccionesConUsuario(4, parseInt(req.query.pagina))

	res.json(data); //TODO: implementar
});

app.use(function(req, res, next) { next(createError(404)); });
//A: si ningun handler respondio antes, crear un error 404

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {}; //TODO: SEC: no devolver stacktrace en produccion

  res.status(err.status || 500);
  res.render('error');
	//A: devolvi info de error usando la plantilla EJS (TODO: casos JSON?)
});
//A: si se produjo un error devolver detalles

module.exports= app
