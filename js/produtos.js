const categorias = {
	1: {
		printName: "Cordas",
		symbolName: "cordas",
	},
	2: {
		printName: "Madeiras",
		symbolName: "madeiras",
	},
	3: {
		printName: "Metais",
		symbolName: "metais",
	},
	4: {
		printName: "Acessórios",
		symbolName: "acessorios",
	},
};

const produtos = [
	{
		id: 1,
		nome: "Flauta Transversal",
		categoria: 2,
		preco: 700.0,
		avaliacao: 5,
		img_url: "https://picsum.photos/seed/1/400/300",
		img_alt: "Flauta Transversal"
	},
	{
		id: 2,
		nome: "Trompete Bb",
		categoria: 3,
		preco: 800.0,
		avaliacao: 5,
		img_url: "https://picsum.photos/seed/2/400/300",
		img_alt: "Trompete Bb",
	},
	{
		id: 3,
		nome: "Saxofone Barítono",
		categoria: 3,
		preco: 5000.0,
		avaliacao: 5,
		img_url: "https://picsum.photos/seed/3/400/300",
		img_alt: "Saxofone Barítono",
	},
	{
		id: 4,
		nome: "Fagote",
		categoria: 2,
		preco: 9000.0,
		avaliacao: 5,
		img_url: "https://picsum.photos/seed/4/400/300",
		img_alt: "Fagote",
	},
	{
		id: 5,
		nome: "Violino",
		categoria: 1,
		preco: 900.0,
		avaliacao: 5,
		img_url: "https://picsum.photos/seed/5/400/300",
		img_alt: "Violino",
	},
	{
		id: 6,
		nome: "Contrabaixo",
		categoria: 1,
		preco: 4500.0,
		avaliacao: 5,
		img_url: "https://picsum.photos/seed/6/400/300",
		img_alt: "Contrabaixo",
	},
	{
		id: 7,
		nome: "Arco de Pau-Brasil",
		categoria: 4,
		preco: 400.0,
		avaliacao: 5,
		img_url: "https://picsum.photos/seed/7/400/300",
		img_alt: "Arco de Pau-Brasil",
	},
	{
		id: 8,
		nome: "Afinador Eletrônico",
		categoria: 4,
		preco: 80.0,
		avaliacao: 3,
		img_url: "https://picsum.photos/seed/8/400/300",
		img_alt: "Afinador Eletrônico",
	},
]

export {categorias, produtos};
