//VER: https://sequelize.org/docs/v6/core-concepts/model-basics/
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ //TODO: leer de Configuracion
	'dialect': 'sqlite',
	'storage': 'db.sqlite3'
});

//S: Modelos =================================================
const Modelos= {}
Modelos.Usuario = sequelize.define('Usuario', {
		nic: { //TODO: unique
			type: DataTypes.STRING,
			allowNull: false,
		}, 
	}, {
		tableName: 'usuario',
});

Modelos.Transaccion = sequelize.define('Transaccion', {
		cuanto: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		motivo: {
			type: DataTypes.STRING,
		},
	}, {
		tableName: 'transaccion',
});
//A: sqlize agrega automaticamente ceratedAt y updatedAt con fecha y hora, el resto son relaciones aca abajo

Modelos.Usuario.hasMany( Modelos.Transaccion, { as: 'DeUsuario' } );
Modelos.Transaccion.belongsTo( Modelos.Usuario , { as: 'DeUsuario' });
//A: conectamos Transaccion al usuario que PAGA
Modelos.Usuario.hasMany( Modelos.Transaccion, { as: 'AUsuario' } );
Modelos.Transaccion.belongsTo( Modelos.Usuario , { as: 'AUsuario' });
//A: conectamos Transaccion al usuario que COBRA
//VER: https://sequelize.org/docs/v6/core-concepts/assocs/#options-1
//VER: https://sequelize.org/docs/v6/core-concepts/assocs/#defining-an-alias
//TODO: por algun motivo nos esta agregando una columna UsuarioId que NO VA!

//S: Datos de prueba  =================================================
async function crearDatosDePrueba() {
	const u= await crearVarios( Modelos.Usuario, [
		{ nic: "BancoCentral" },
		{ nic: "usrDos" },
		{ nic: "usrTres" },
		{ nic: "usrCuatro" },
		{ nic: "usrCinco" },
	]);

	const tx_d= [
		{ cuanto: 100, DeUsuarioId: u[0].id, AUsuarioId: u[1].id },
		{ cuanto: 101, DeUsuarioId: u[0].id, AUsuarioId: u[2].id },
		{ cuanto: 12, DeUsuarioId: u[1].id, AUsuarioId: u[2].id },
	];

	for (var i=1; i<100; i++) { //A: para tener algunos con muchas tx y paginar
		tx_d.push(
			{ cuanto: i, DeUsuarioId: u[0].id, AUsuarioId: u[3].id },
		);
	}

	const tx= await crearVarios( Modelos.Transaccion, tx_d);

	return { u , tx };
}

//S: Libreria =========================================================
async function crearVarios(modelo, datos) { //U: crea todos los elementos del array y los devuelve
	return Promise.all( datos.map( d => modelo.create(d) ) );
}

async function transaccionesConUsuario(unUsuarioId, pagina=0, paginaCuantos= 10) { //U: todas las tx donde cobra o paga unUsuarioId
	//VER: https://sequelize.org/api/v6/class/src/model.js~model#static-method-findAll
	var array= await Modelos.Transaccion.findAll( { 
		limit: paginaCuantos,
		offset: (pagina * paginaCuantos),

		include: [
			{ model: Modelos.Usuario, as: 'DeUsuario', attributes: ['nic'] },
			{ model: Modelos.Usuario, as: 'AUsuario', attributes: ['nic'] },
		],
		where: {
			[Sequelize.Op.or]: [
				{AUsuarioId: unUsuarioId},
				{DeUsuarioId: unUsuarioId},
			],
		},
		attributes: ['id','cuanto','motivo','createdAt'],
	} ) ;

	return array;	
}

async function BorrarYRecrearDb( quiereDatosDePrueba ) { //U: BORRA y (re)crea db, tablas y datos de prueba
	//TODO: hacer un script aparte para llamarla desde la consola
	await sequelize.sync({ force: true });
	console.log("Modelos creados");
	if ( quiereDatosDePrueba ) {
		await crearDatosDePrueba();
	}
	console.log("Datos de prueba creados");
}

module.exports= { Sequelize, BorrarYRecrearDb, transaccionesConUsuario, ...Modelos };
