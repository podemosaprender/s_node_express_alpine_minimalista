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
	console.log("REQ method, path", req.method, req.path);

	let data= {error: 'desconocido'};

	if (req.method=='GET' && req.path=='/transacciones') { //TODO: permisos, validaciones
		const pagina= parseInt(req.query.pagina)
		const usuario= parseInt(req.query.usuario)
		data= await db.transaccionesConUsuario(usuario, pagina)
	}
	else if (req.method=='POST' && req.path=='/enviar') {//TODO: permisos, validaciones
		const de= parseInt(req.body.de);
		const a= parseInt(req.body.a);
		const cuanto= parseInt(req.body.cuanto);
		const motivo= (req.body.motivo+'').substr(0,40);
		const d= { DeUsuarioId: de, AUsuarioId: a, cuanto, motivo };
		try {
			data= await db.Transaccion.create(d);	
		} catch(ex) {
			console.error("ERR Enviar",d,ex);
		}
	}
	console.log(JSON.stringify(data));
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
